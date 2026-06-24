# Sourcive

AI-powered streaming chat. Portfolio project demonstrating real-time LLM integration, persistent chat history, and provider-agnostic architecture.

## Features

- **Streaming responses** — token-by-token via SSE, no AI SDK
- **Persistent chat history** — Supabase Postgres, per-user isolation via RLS
- **No login required** — anonymous sessions handled automatically
- **Multi-provider LLM** — Groq, OpenRouter, Gemini, or Mock via one env var
- **Markdown + syntax highlighting** — rendered live as tokens arrive
- **Collapsible sidebar** — conversation list with new/delete actions
- **Token & cost tracking** — per-response usage stats
- **Rate limiting** — per-IP and global daily quota
- **Dark mode**

## Stack

- **Framework** — Next.js 16 (App Router) + TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **Database** — Supabase (Postgres + anonymous auth + RLS)
- **LLM providers** — Groq, OpenRouter, Google Gemini
- **Testing** — Jest + @testing-library/react

## Getting Started

```bash
npm install
npm run dev
```

Copy the env block below into `.env.local` and fill in your keys.

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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Rate limiting (optional)
RATE_LIMIT_PER_IP=20
RATE_LIMIT_GLOBAL=500

# System prompt (optional)
SYSTEM_PROMPT="You are a helpful assistant."
```

## Architecture

```
src/
  app/
    api/chat/route.ts          # SSE streaming endpoint, rate limiting
    chat/[id]/page.tsx         # chat UI — loads/saves messages per conversation
    page.tsx                   # redirects to /chat/<new-uuid>
  components/
    chat/                      # MessageContent — markdown + streaming cursor
    sidebar/                   # collapsible conversation list
  contexts/
    conversations-context.tsx  # shared state across sidebar and chat page
  hooks/
    use-chat.ts                # SSE streaming, abort, usage tracking
    use-conversations.ts       # Supabase CRUD + anonymous auth
  lib/
    llm.ts                     # provider-agnostic ChatModel interface
    rate-limit.ts              # in-memory per-IP + global limiter
    supabase.ts                # singleton browser client
```

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```
