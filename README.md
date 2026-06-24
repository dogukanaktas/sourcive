# Sourcive

AI-powered streaming chat built as a portfolio project to demonstrate real-time LLM integration, persistent chat history, provider-agnostic architecture, and modern frontend engineering.

## Features

- **Token-by-token streaming** — SSE-based streaming via a custom `ReadableStream` pipeline, no AI SDK
- **Persistent chat history** — conversations and messages stored in Supabase Postgres with per-user isolation via Row Level Security
- **Anonymous auth** — users get their own session automatically, no login required (`supabase.auth.signInAnonymously`)
- **Provider-agnostic LLM layer** — swap Groq, OpenRouter, Gemini, or Mock by changing one env var
- **Primary/fallback model** — automatically retries with a fallback model on 429/503
- **Custom `useChat` hook** — buffer-safe SSE parsing, abort/stop, optimistic UI
- **Collapsible sidebar** — conversation list with new/delete actions, relative timestamps, active highlight
- **Markdown + syntax highlighting** — rendered live as tokens stream in (`react-markdown` + `rehype-highlight`)
- **Token & cost tracking** — displays token count and estimated cost per response
- **Rate limiting** — per-IP and global daily quota (in-memory, configurable via env)
- **Dark mode** — system default, toggleable (`next-themes`)
- **Unit + component tests** — Jest + Testing Library covering hooks, utilities, sidebar, and API route

## Stack

- **Framework** — Next.js 16 (App Router) + TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **Database** — Supabase (Postgres + anonymous auth + RLS)
- **LLM providers** — Groq, OpenRouter, Google Gemini (provider-agnostic via `src/lib/llm.ts`)
- **Testing** — Jest + @testing-library/react

## Getting Started

```bash
npm install
cp .env.example .env.local   # add your API keys
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

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
    api/chat/route.ts          # SSE streaming endpoint, rate limiting, system prompt
    chat/[id]/page.tsx         # chat UI — loads/saves messages, landing + chat layouts
    page.tsx                   # redirects to /chat/<new-uuid>
  components/
    chat/                      # MessageContent with markdown + streaming cursor
    sidebar/                   # Sidebar + SidebarLayout (collapsible, conversation list)
    ui/                        # shadcn components
  contexts/
    conversations-context.tsx  # shared Supabase state across sidebar and chat page
  hooks/
    use-chat.ts                # streaming hook — abort, usage tracking, resetWithMessages
    use-conversations.ts       # Supabase CRUD — auth, load, create, delete, save messages
  lib/
    llm.ts                     # provider-agnostic LLM layer (ChatModel interface)
    rate-limit.ts              # in-memory per-IP + global rate limiter
    supabase.ts                # singleton browser client
  types/
    conversation.ts            # Conversation type
```

The `ChatModel` interface in `lib/llm.ts` is the key abstraction — every provider implements `streamChat()` returning an `AsyncIterable<string>`. Adding a new provider means adding one factory function and one `case` in `getModel()`.

## Testing

```bash
npm test                # run all tests
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report
```

## Milestones

| Tag | Description |
|-----|-------------|
| `v0.1.0` | Streaming core — SSE endpoint + custom useChat hook |
| `v0.2.0` | Chat UI — full-width layout, markdown, system prompt |
| `v0.3.0` | Rate limiting, Groq provider, dark mode |
| `v0.4.0` | Persistent chat history — Supabase, anonymous auth, sidebar |
| `v0.5.0` | Unit + component tests — Jest, Testing Library |
