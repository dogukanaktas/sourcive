import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

/**
 * Provider-agnostic LLM layer.
 *
 * The ONLY contract the rest of the app depends on is `ChatModel`. Every
 * provider yields plain text deltas via an async generator, so the transport
 * layer (the API route) never imports a vendor SDK directly. Swapping
 * Gemini -> Claude -> Groq means adding one factory that returns a `ChatModel`
 * and registering it in `getModel()` — nothing else in the codebase changes.
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Pricing {
  /** USD per million input tokens */
  inputPerM: number;
  /** USD per million output tokens */
  outputPerM: number;
}

export interface StreamOptions {
  signal?: AbortSignal;
  onUsage?: (usage: UsageStats) => void;
}

export interface ChatModel {
  readonly id: string;
  readonly pricing?: Pricing;
  streamChat(
    messages: ChatMessage[],
    opts?: StreamOptions,
  ): AsyncIterable<string>;
}

/* -------------------------------------------------------------------------- */
/* Mock provider — lets us verify the streaming pipeline with no API key/cost. */
/* -------------------------------------------------------------------------- */

const MOCK_REPLY =
  "Bu bir **mock** yanıt. Çekirdek streaming altyapısını API anahtarı olmadan " +
  "doğrulamak için buradayım. Eğer bu metni token token akıyor görüyorsan, " +
  "ReadableStream + reader/decoder döngüsü ve SSE çerçeveleme doğru çalışıyor demektir.";

function createMockModel(): ChatModel {
  return {
    id: "mock",
    async *streamChat(_messages, opts) {
      // Split on whitespace but keep the spaces, so the text reassembles intact.
      const tokens = MOCK_REPLY.split(/(\s+)/);
      for (const token of tokens) {
        if (opts?.signal?.aborted) return;
        await new Promise((resolve) => setTimeout(resolve, 40));
        yield token;
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Gemini provider.                                                           */
/* -------------------------------------------------------------------------- */

function createGeminiModel(apiKey: string, model: string): ChatModel {
  // The client lives in this closure — encapsulated like a private field,
  // never exposed outside the factory.
  const client = new GoogleGenAI({ apiKey });

  return {
    id: "gemini",
    async *streamChat(messages, opts) {
      // Gemini's wire format differs from ours: assistant -> "model", and the
      // system prompt is a separate field rather than a message in the array.
      const systemInstruction = messages.find(
        (m) => m.role === "system",
      )?.content;
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const stream = await client.models.generateContentStream({
        model,
        contents,
        ...(systemInstruction ? { config: { systemInstruction } } : {}),
      });

      for await (const chunk of stream) {
        if (opts?.signal?.aborted) return;
        const text = chunk.text;
        if (text) yield text;
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* OpenAI-compatible provider (OpenRouter, Groq, etc.)                        */
/* -------------------------------------------------------------------------- */

function createOpenAICompatibleModel(
  apiKey: string,
  baseURL: string,
  models: string[],
  pricing?: Pricing,
): ChatModel {
  const client = new OpenAI({ apiKey, baseURL });

  return {
    id: new URL(baseURL).hostname,
    pricing,
    async *streamChat(messages, opts) {
      for (const model of models) {
        try {
          const stream = await client.chat.completions.create({
            model,
            stream: true,
            stream_options: { include_usage: true },
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

          let usage: UsageStats | null = null;

          for await (const chunk of stream) {
            if (opts?.signal?.aborted) {
              stream.controller.abort();
              return;
            }
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
            // The last chunk carries usage data (when stream_options.include_usage is true).
            if (chunk.usage) {
              usage = {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens,
                totalTokens: chunk.usage.total_tokens,
              };
            }
          }

          if (usage) opts?.onUsage?.(usage);
          return;
        } catch (err) {
          const status = (err as { status?: number }).status;
          const isRetryable = status === 503 || status === 429;
          if (!isRetryable || model === models.at(-1)) throw err;
        }
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Factory — the single place that decides which provider is active.          */
/* -------------------------------------------------------------------------- */

export function getModel(): ChatModel {
  // Default to the real provider when a key exists, otherwise fall back to the
  // mock so a fresh checkout runs end-to-end with zero configuration.
  const provider =
    process.env.LLM_PROVIDER ??
    (process.env.GEMINI_API_KEY ? "gemini" : "mock");

  switch (provider) {
    case "mock":
      return createMockModel();

    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "LLM_PROVIDER=gemini but GEMINI_API_KEY is not set in .env.local",
        );
      }
      return createGeminiModel(
        apiKey,
        process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      );
    }

    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is not set");
      return createOpenAICompatibleModel(apiKey, "https://openrouter.ai/api/v1", [
        process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free",
        process.env.OPENROUTER_MODEL_FALLBACK ?? "meta-llama/llama-3.3-70b-instruct:free",
      ], { inputPerM: 0.10, outputPerM: 0.10 });
    }

    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("LLM_PROVIDER=groq but GROQ_API_KEY is not set");
      return createOpenAICompatibleModel(apiKey, "https://api.groq.com/openai/v1", [
        process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      ], { inputPerM: 0.59, outputPerM: 0.79 });
    }

    default:
      throw new Error(`Unknown LLM_PROVIDER: "${provider}"`);
  }
}
