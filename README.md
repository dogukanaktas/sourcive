# Sourcive

AI-powered streaming chat built as a portfolio project to demonstrate real-time LLM integration, provider-agnostic architecture, and modern frontend engineering.

## Features

- **Token-by-token streaming** — SSE-based streaming via a custom `ReadableStream` pipeline, no AI SDK
- **Provider-agnostic LLM layer** — swap Groq, OpenRouter, Gemini, or Mock by changing one env var
- **Primary/fallback model** — automatically retries with a fallback model on 429/503
- **Custom `useChat` hook** — buffer-safe SSE parsing, abort/stop, optimistic UI
- **Markdown + syntax highlighting** — rendered live as tokens stream in (`react-markdown` + `rehype-highlight`)
- **Token & cost tracking** — displays token count and estimated cost per response
- **Rate limiting** — per-IP and global daily quota (in-memory, configurable via env)
- **Dark mode** — system default, toggleable (`next-themes`)

## Stack

- **Framework** — Next.js 16 (App Router) + TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **LLM providers** — Groq, OpenRouter, Google Gemini (provider-agnostic via `src/lib/llm.ts`)

## Getting Started

```bash
npm install
cp .env.example .env.local   # add your API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Provider: "groq" | "openrouter" | "gemini" | "mock"
LLM_PROVIDER=groq

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile          # optional

# OpenRouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemma-4-31b-it:free  # optional
OPENROUTER_MODEL_FALLBACK=meta-llama/llama-3.3-70b-instruct:free  # optional

# Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash               # optional

# Rate limiting (optional)
RATE_LIMIT_PER_IP=20    # requests per IP per day
RATE_LIMIT_GLOBAL=500   # total requests per day

# System prompt (optional)
SYSTEM_PROMPT="You are a helpful assistant."
```

## Architecture

```
src/
  app/
    api/chat/route.ts     # SSE streaming endpoint, rate limiting, system prompt
    page.tsx              # chat UI (landing + chat layouts)
  components/
    chat/                 # MessageContent with markdown + streaming cursor
    ui/                   # shadcn components
  hooks/
    use-chat.ts           # custom streaming hook with abort + usage tracking
  lib/
    llm.ts                # provider-agnostic LLM layer (ChatModel interface)
    rate-limit.ts         # in-memory per-IP + global rate limiter
```

The `ChatModel` interface in `lib/llm.ts` is the key abstraction — every provider implements `streamChat()` returning an `AsyncIterable<string>`. Adding a new provider means adding one factory function and one `case` in `getModel()`.

## Milestones

| Tag | Description |
|-----|-------------|
| `v0.1.0` | Streaming core — SSE endpoint + custom useChat hook |
| `v0.2.0` | Chat UI — full-width layout, markdown, system prompt |
| `v0.3.0` | Rate limiting, Groq provider, dark mode |
