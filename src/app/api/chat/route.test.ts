/**
 * @jest-environment node
 */
import { POST } from "./route";

// Mock rate limiter
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
}));

// Mock LLM model
const mockStreamChat = jest.fn();
jest.mock("@/lib/llm", () => ({
  getModel: () => ({
    pricing: null,
    streamChat: mockStreamChat,
  }),
}));

import { checkRateLimit } from "@/lib/rate-limit";

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function* deltaStream(texts: string[]) {
  for (const text of texts) yield text;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStreamChat.mockReturnValue(deltaStream(["hello"]));
});

describe("POST /api/chat — validation", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages array is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages array is empty", async () => {
    const res = await POST(makeRequest({ messages: [] }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/chat — rate limiting", () => {
  it("returns 429 when per-IP limit is exceeded", async () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce({ allowed: false, reason: "ip_limit" });
    const res = await POST(makeRequest({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(429);
  });

  it("returns 429 when global limit is exceeded", async () => {
    (checkRateLimit as jest.Mock).mockReturnValueOnce({ allowed: false, reason: "global_limit" });
    const res = await POST(makeRequest({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/chat — successful response", () => {
  it("returns 200 with SSE content-type", async () => {
    const res = await POST(makeRequest({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/event-stream/);
  });

  it("streams delta events in the response body", async () => {
    mockStreamChat.mockReturnValue(deltaStream(["foo", "bar"]));
    const res = await POST(makeRequest({ messages: [{ role: "user", content: "hi" }] }));

    const text = await res.text();
    expect(text).toContain('"type":"delta"');
    expect(text).toContain('"text":"foo"');
    expect(text).toContain('"text":"bar"');
    expect(text).toContain('"type":"done"');
  });
});
