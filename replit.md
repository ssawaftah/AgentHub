# AgentHub AI

AI-powered customer service platform that lets businesses deploy intelligent agents to reply to Instagram DMs automatically.

## Run & Operate

- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `PORT=18509 BASE_PATH=/ pnpm --filter @workspace/agent-hub run dev` — run the frontend (port 18509)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server, port 8080, path /api)
- Frontend: React + Vite (artifacts/agent-hub, port 18509, path /)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (cookie-based proxy middleware)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `lib/db/src/schema/` — all DB table definitions (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-zod/` — Zod schemas generated from OpenAPI spec
- `lib/api-client-react/` — React Query hooks generated from OpenAPI spec
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — providers (AI), instagram-worker, logger
- `artifacts/agent-hub/src/pages/` — React pages
- `artifacts/agent-hub/src/components/` — shared UI components

## Architecture decisions

- Clerk auth uses cookie-based sessions via a proxy middleware; the proxy must be mounted before body parsers. Never call `getToken()` in the browser.
- All routes go through `/api` except Instagram webhooks which live at `/webhook/instagram` (Meta requires a stable root URL).
- Instagram message queue is PostgreSQL-backed (`instagram_messages` table with `processedAt` column). Worker uses `FOR UPDATE SKIP LOCKED` for safe concurrent processing. **No Cloudflare services** (user preference).
- AI provider abstraction in `artifacts/api-server/src/lib/providers/` — add new providers by implementing `IProvider`.
- Access tokens stored as-is in dev; encrypt at rest in production.

## Product

- **Workspaces** — multi-tenant, each user can have multiple workspaces
- **Businesses** — business profiles with brand voice, policies
- **Agents** — AI agents with configurable persona, provider (Gemini/OpenAI/Claude/DeepSeek), and model
- **AI Brains** — system prompts + knowledge base items, linked to agents
- **Instagram** — connect a Business account, assign an agent to handle DMs, monitor via /instagram page
- **Settings** — API key management per workspace
- **Dashboard** — activity feed, agent/provider charts

## Phase status

- ✅ Phase 1 — Foundation (auth, DB, API, frontend)
- ✅ Phase 2 — AI Engine (providers, brains, knowledge, agent chat tester)
- ✅ Phase 3 — Instagram Integration (webhook, auto-reply worker, connect page)
- ⬜ Phase 4 — Analytics & Polish

## User preferences

- No Cloudflare services — use DB-backed queues instead
- Express 5 wildcard routes use `/{*splat}` syntax
- Keep project structure as-is (do not restructure/migrate)

## Gotchas

- Clerk proxy middleware must be mounted BEFORE `express.json()` / body parsers (it streams raw bytes)
- Express 5 async handlers need explicit `Promise<void>` return type; early returns need `res.json(); return;`
- `BASE_PATH` env var required by Vite config — always set when running the frontend
- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` then rebuild the server
- After any DB schema change: run `pnpm --filter @workspace/db run push`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
