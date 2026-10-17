/**
 * @jest-environment node
 */
import { getModel } from "./llm";

const mockCreate = jest.fn();
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

async function* chunks(texts: string[], failAfter?: Error) {
  for (const text of texts) yield { choices: [{ delta: { content: text } }] };
  if (failAfter) throw failAfter;
}

async function collect(iter: AsyncIterable<string>) {
  let out = "";
  for await (const t of iter) out += t;
  return out;
}

const messages = [{ role: "user" as const, content: "hi" }];

describe("groq fallback", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.LLM_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "test";
    process.env.GROQ_MODEL = "primary";
    process.env.GROQ_MODEL_FALLBACK = "backup";
  });

  it("falls back to the next model on 429", async () => {
    mockCreate
      .mockRejectedValueOnce(httpError(429))
      .mockResolvedValueOnce(chunks(["ok"]));

    const out = await collect(getModel().streamChat(messages));

    expect(out).toBe("ok");
    expect(mockCreate.mock.calls.map((c) => c[0].model)).toEqual(["primary", "backup"]);
  });

  it("falls back on 503", async () => {
    mockCreate
      .mockRejectedValueOnce(httpError(503))
      .mockResolvedValueOnce(chunks(["ok"]));

    expect(await collect(getModel().streamChat(messages))).toBe("ok");
  });

  it("does not fall back on non-retryable errors like 404", async () => {
    mockCreate.mockRejectedValueOnce(httpError(404));

    await expect(collect(getModel().streamChat(messages))).rejects.toMatchObject({ status: 404 });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("throws when the last model also fails", async () => {
    mockCreate.mockRejectedValue(httpError(429));

    await expect(collect(getModel().streamChat(messages))).rejects.toMatchObject({ status: 429 });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("does not fall back once tokens have been streamed", async () => {
    mockCreate.mockResolvedValueOnce(chunks(["partial"], httpError(429)));

    await expect(collect(getModel().streamChat(messages))).rejects.toMatchObject({ status: 429 });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
