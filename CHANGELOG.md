# Changelog

## [0.3.0] — 2026-07-14 — Phase 2: AI Engine (Frontend Complete)

### Added

**Frontend — Settings Page (`/settings`)**
- API Keys management: list masked keys per provider, add new key (dialog with show/hide), test key live against provider API, delete key
- Provider color-coding: Gemini=blue, OpenAI=green, DeepSeek=purple, Claude=orange
- Tab-based layout (API Keys tab active; Billing/Team placeholders for future phases)

**Frontend — AI Brains Page (`/brains`)**
- Brain cards grid: name, assigned agent badge, system prompt snippet, creation date
- Create Brain dialog: name, assign to agent (select), system prompt (textarea), fallback message
- Navigate to Brain Detail from each card

**Frontend — Brain Detail + Knowledge Base (`/brains/:id`)**
- Editable brain header: name, agent assignment, system prompt (large editor), fallback message
- Knowledge Base section: add text/url/faq items, view list with type badges, delete items
- Source URL field visible only when type=url
- Info callout explaining automatic context injection into agent chat

**Frontend — Agent Chat Tester (tab in Agent Detail)**
- 4th tab added to existing Agent Detail page without touching other tabs
- Real-time multi-turn chat using `useChatWithAgent` hook
- User bubbles (right, blue) / agent bubbles (left, dark card) with token count display
- Loading indicator, Clear conversation button, "No API key" warning banner

**Navigation**
- Sidebar: added "AI Brains" (Brain icon) and "Settings" (Key icon) nav items
- App.tsx: routes `/brains`, `/brains/:id`, `/settings` registered

---

## [0.2.0] — 2026-07-14 — Phase 2: AI Engine (Backend)

### Added
- DB tables: api_keys, ai_brains, knowledge_items
- OpenAPI Phase 2 spec + Codegen re-generated
- Provider Abstraction Layer: Gemini, DeepSeek, OpenAI, Claude
- API Routes: api_keys CRUD+test, ai_brains CRUD, knowledge_items CRUD, agent chat

---

## [0.1.0] — 2026-07-14 — Phase 1: Foundation

### Added
- Full project setup: Monorepo, Clerk Auth, PostgreSQL, Drizzle ORM
- OpenAPI spec + Orval codegen pipeline
- Full REST API (workspaces, businesses, agents, dashboard, activity)
- Frontend: Landing, Dashboard (Recharts), Agents (3-step wizard), Businesses, Workspaces, Auth pages
- Activity logging + Project tracking files
