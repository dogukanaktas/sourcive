import { getModel, type ChatMessage } from "@/lib/llm";

// Node is the default runtime; stated explicitly because the Gemini SDK relies
// on Node APIs. (Edge would also work for fetch-based SDKs, but Node is safest.)
export const runtime = "nodejs";

/** One SSE event = `data: <json>\n\n`. JSON lets us tag each event's type. */
function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  // 1. Parse + validate the request body before touching the model.
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("`messages` must be a non-empty array", {
        status: 400,
      });
    }
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // 2. Resolve the active provider behind the ChatModel contract.
  let model;
  try {
    model = getModel();
  } catch (err) {
    const message = err instanceof Error ? err.message : "model init failed";
    console.error("[api/chat] getModel() failed:", message);
    return new Response(message, { status: 500 });
  }
  const encoder = new TextEncoder();

  // 3. Turn the provider's async generator into an SSE-framed byte stream.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of model.streamChat(messages, {
          signal: req.signal, // aborts upstream when the client disconnects
        })) {
          controller.enqueue(encoder.encode(sseEvent({ type: "delta", text: delta })));
        }
        controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
      } catch (err) {
        // Status is already 200 once streaming starts, so we surface the error
        // as an in-band event rather than an HTTP error code.
        const message = err instanceof Error ? err.message : "stream failed";
        controller.enqueue(encoder.encode(sseEvent({ type: "error", error: message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
      Connection: "keep-alive",
    },
  });
}
