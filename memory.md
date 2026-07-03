# Memory

Working notes for this project — context that isn't obvious from the code or README, kept up to date as the project evolves.

## What this is

Sourcive — AI-powered streaming chat, portfolio project. Next.js 16 (App Router) + TypeScript, Supabase for persistence, provider-agnostic LLM layer (Groq / OpenRouter / Gemini / Mock).

See `README.md` for setup, env vars, and architecture overview — this file is for context that changes over time or isn't documented elsewhere.

## Current setup

- Active LLM provider (local `.env.local`): **Groq**. OpenRouter and Gemini keys are commented out — code paths exist and are provider-agnostic (`src/lib/llm.ts`) but only Groq is live locally.
- Auth: anonymous Supabase sessions only, no login flow.

## Source layout (quick map)

```
src/app/
  api/chat/route.ts          # SSE streaming endpoint + rate limiting (route.test.ts covers it)
  page.tsx                   # landing, redirects into /chat/<id>
  chat/[id]/page.tsx         # chat UI
  opengraph-image.tsx        # dynamic OG image generation
src/components/
  chat/                      # chat-view, message-content (markdown + streaming cursor)
  sidebar/                   # collapsible conversation list (sidebar.test.tsx)
  ui/                        # shadcn-based primitives (button, input, textarea, scroll-area)
src/contexts/
  chat-context.tsx, conversations-context.tsx
src/hooks/
  use-chat.ts                # SSE streaming, abort, usage tracking (has tests)
  use-conversations.ts       # Supabase CRUD + anonymous auth
src/lib/
  llm.ts                     # provider-agnostic ChatModel interface (Groq/OpenRouter/Gemini/Mock)
  rate-limit.ts              # in-memory per-IP + global limiter (has tests)
  supabase.ts                # singleton browser client
```

No TODO/FIXME markers currently in `src/`.

## Notes

- `AGENTS.md` flags that this Next.js version has breaking changes vs. training data — check `node_modules/next/dist/docs/` before writing framework-specific code.
- Recent work (see `git log`) has focused on meta/OG tags (dynamic OG image, LinkedIn description length requirements) and cleanup (removed create-next-app boilerplate, landing page UUID handling).
- Test coverage exists for: chat API route, use-chat hook, rate-limit, sidebar component. No tests yet for conversations-context, message-content, or the chat page itself.
- Rate limiting is in-memory (`rate-limit.ts`) — resets on server restart/redeploy, not persisted. Fine for a single-instance portfolio deploy, would need a shared store (Redis etc.) if scaled to multiple instances.

## Open questions / TODO

- (none tracked yet — add here as they come up)
