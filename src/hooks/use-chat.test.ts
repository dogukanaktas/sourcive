import { renderHook, act } from "@testing-library/react";
import { useChat } from "./use-chat";

// Build a minimal SSE-like ReadableStream from an array of raw event strings.
function makeStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const ev of events) {
        controller.enqueue(encoder.encode(ev));
      }
      controller.close();
    },
  });
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function mockFetch(events: string[], status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    body: makeStream(events),
    text: async () => "error",
  });
}

afterEach(() => jest.restoreAllMocks());

describe("useChat — initial state", () => {
  it("starts with empty messages and no loading", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe("useChat — clearMessages", () => {
  it("empties messages and resets error/usage", async () => {
    mockFetch([sseEvent({ type: "delta", text: "hello" }), sseEvent({ type: "done" })]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.setInput("hi");
    });
    await act(async () => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    act(() => result.current.clearMessages());
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe("useChat — resetWithMessages", () => {
  it("replaces messages with provided array", () => {
    const { result } = renderHook(() => useChat());
    const initial = [
      { role: "user" as const, content: "hello" },
      { role: "assistant" as const, content: "hi" },
    ];
    act(() => result.current.resetWithMessages(initial));
    expect(result.current.messages).toEqual(initial);
  });
});

describe("useChat — successful stream", () => {
  it("accumulates delta events into the last assistant message", async () => {
    mockFetch([
      sseEvent({ type: "delta", text: "hel" }),
      sseEvent({ type: "delta", text: "lo" }),
      sseEvent({ type: "done" }),
    ]);

    const { result } = renderHook(() => useChat());

    await act(async () => result.current.setInput("test"));
    await act(async () => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.content).toBe("hello");
    expect(result.current.isLoading).toBe(false);
  });

  it("parses usage events and stores them", async () => {
    mockFetch([
      sseEvent({ type: "delta", text: "ok" }),
      sseEvent({ type: "usage", promptTokens: 10, completionTokens: 5, totalTokens: 15, estimatedCost: 0.001 }),
      sseEvent({ type: "done" }),
    ]);

    const { result } = renderHook(() => useChat());
    await act(async () => result.current.setInput("test"));
    await act(async () => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.usage).toMatchObject({ totalTokens: 15, estimatedCost: 0.001 });
  });
});

describe("useChat — error handling", () => {
  it("sets error state on HTTP error response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      body: null,
      text: async () => "rate limited",
    });

    const { result } = renderHook(() => useChat());
    await act(async () => result.current.setInput("test"));
    await act(async () => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error on in-stream error event", async () => {
    mockFetch([sseEvent({ type: "error", error: "model crashed" })]);

    const { result } = renderHook(() => useChat());
    await act(async () => result.current.setInput("test"));
    await act(async () => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.error).toBe("model crashed");
  });
});

describe("useChat — stop", () => {
  it("calling stop() aborts the in-flight request", async () => {
    const abortSpy = jest.fn();
    global.fetch = jest.fn().mockImplementation((_url, { signal }: RequestInit) => {
      signal?.addEventListener("abort", abortSpy);
      return new Promise(() => {}); // never resolves
    });

    const { result } = renderHook(() => useChat());
    await act(async () => result.current.setInput("test"));

    act(() => {
      result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });
    act(() => result.current.stop());

    expect(abortSpy).toHaveBeenCalled();
  });
});
