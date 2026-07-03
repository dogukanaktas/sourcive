# Memory

Working notes for this project — context that isn't obvious from the code or README, kept up to date as the project evolves.

## What this is

Sourcive — AI-powered streaming chat, portfolio project. Next.js 16 (App Router) + TypeScript, Supabase for persistence, provider-agnostic LLM layer (Groq / OpenRouter / Gemini / Mock).

See `README.md` for setup, env vars, and architecture overview — this file is for context that changes over time or isn't documented elsewhere.

## Notes

- `AGENTS.md` flags that this Next.js version has breaking changes vs. training data — check `node_modules/next/dist/docs/` before writing framework-specific code.
- Recent work has focused on meta/OG tags (dynamic OG image, LinkedIn description length requirements) and cleanup (removed create-next-app boilerplate, landing page UUID handling).

## Open questions / TODO

- (none tracked yet)
