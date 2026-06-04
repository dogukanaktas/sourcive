import { getModel, type ChatMessage } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";

// Node is the default runtime; stated explicitly because the Gemini SDK relies
// on Node APIs. (Edge would also work for fetch-based SDKs, but Node is safest.)
export const runtime = "nodejs";

const ERRORS = {
  invalidBody: "`messages` must be a non-empty array",
  invalidJson: "Invalid JSON body",
  modelInitFailed: "Model initialization failed",
  streamFailed: "Stream failed",
  globalLimit: "Daily demo quota reached. Please try again tomorrow.",
  ipLimit: "You've reached your daily message limit. Please try again tomorrow.",
} as const;

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Always respond in the same language the user writes in.";

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
      return new Response(ERRORS.invalidBody, { status: 400 });
    }
  } catch {
    return new Response(ERRORS.invalidJson, { status: 400 });
  }

  // 2. Rate limiting — check before any expensive work.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed, reason } = checkRateLimit(ip);
  if (!allowed) {
    const message = reason === "global_limit" ? ERRORS.globalLimit : ERRORS.ipLimit;
    return new Response(message, { status: 429 });
  }

  // Prepend a system prompt if one is configured — kept server-side so the
  // client can't override it. Falls back to a sensible default.
  const systemPrompt = process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT;

  const messagesWithSystem: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // 2. Resolve the active provider behind the ChatModel contract.
  let model;
  try {
    model = getModel();
  } catch (err) {
    const message = err instanceof Error ? err.message : ERRORS.modelInitFailed;
    console.error("[api/chat] getModel() failed:", message);
    return new Response(message, { status: 500 });
  }
  const encoder = new TextEncoder();

  // 3. Turn the provider's async generator into an SSE-framed byte stream.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of model.streamChat(messagesWithSystem, {
          signal: req.signal, // aborts upstream when the client disconnects
        })) {
          controller.enqueue(encoder.encode(sseEvent({ type: "delta", text: delta })));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
      } catch (err) {
        // Status is already 200 once streaming starts, so we surface the error
        // as an in-band event rather than an HTTP error code.
        const message = err instanceof Error ? err.message : ERRORS.streamFailed;
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
