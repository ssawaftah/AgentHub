# AgentHub AI — Todo

## Phase 1: Foundation & Core Platform ✅ مكتمل

| ID | Feature | Status |
|----|---------|--------|
| TASK-001 | Project Setup + Auth + DB | ✅ Done |
| TASK-002 | Database Schema (P1) | ✅ Done |
| TASK-003 | API Routes (P1) | ✅ Done |
| TASK-004 | Frontend UI (P1) | ✅ Done |

---

## Phase 2: AI Engine ✅ مكتمل

| ID | Priority | Feature | Status |
|----|----------|---------|--------|
| TASK-010 | HIGH | DB Schema — api_keys | ✅ Done |
| TASK-011 | HIGH | DB Schema — ai_brains | ✅ Done |
| TASK-012 | HIGH | DB Schema — knowledge_items | ✅ Done |
| TASK-013 | HIGH | OpenAPI Spec Phase 2 | ✅ Done |
| TASK-014 | HIGH | Codegen (re-generate) | ✅ Done |
| TASK-015 | HIGH | Provider Abstraction Layer | ✅ Done |
| TASK-016 | HIGH | API Routes — api_keys | ✅ Done |
| TASK-017 | HIGH | API Routes — ai_brains | ✅ Done |
| TASK-018 | HIGH | API Routes — knowledge_items | ✅ Done |
| TASK-019 | HIGH | API Routes — agent chat | ✅ Done |
| TASK-020 | HIGH | Frontend — Settings (API Keys) | ✅ Done |
| TASK-021 | HIGH | Frontend — AI Brains Page | ✅ Done |
| TASK-022 | HIGH | Frontend — Brain Detail + Knowledge Base | ✅ Done |
| TASK-023 | HIGH | Frontend — Agent Chat Tester | ✅ Done |

---

## Phase 3: Instagram Integration ⬜ لم يبدأ

| ID | Priority | Feature | Description | Status |
|----|----------|---------|-------------|--------|
| TASK-030 | HIGH | Instagram App Setup | Meta Developer account, App ID, App Secret | ⬜ Pending |
| TASK-031 | HIGH | Instagram Account Linking | Store IG account tokens per workspace in DB | ⬜ Pending |
| TASK-032 | HIGH | Webhook Endpoint | `GET /webhook/instagram` verify token, `POST /webhook/instagram` receive events | ⬜ Pending |
| TASK-033 | HIGH | Message Queue | Dedup incoming messages, async processing | ⬜ Pending |
| TASK-034 | HIGH | Auto-Reply Engine | Fetch agent → build context → call provider → send via IG API | ⬜ Pending |
| TASK-035 | MEDIUM | Customer Memory | Store customer profiles + conversation summaries | ⬜ Pending |
| TASK-036 | MEDIUM | Frontend — Instagram Connect | OAuth flow, account status, webhook status | ⬜ Pending |

---

## Phase 4: Analytics & Polish ⬜ لم يبدأ

| ID | Priority | Feature | Description | Status |
|----|----------|---------|-------------|--------|
| TASK-040 | HIGH | Token Usage Tracking | Record tokensUsed per chat in DB | ⬜ Pending |
| TASK-041 | MEDIUM | Analytics Dashboard | Charts: messages/day, response time, cost, top agents | ⬜ Pending |
| TASK-042 | MEDIUM | Agent Skills System | Skill toggles per agent (order tracking, returns, FAQs) | ⬜ Pending |
| TASK-043 | MEDIUM | Prompt Template Library | Pre-built templates by industry/role | ⬜ Pending |
| TASK-044 | LOW | Workflow Engine | Visual automation builder | ⬜ Pending |
| TASK-045 | LOW | Multi-channel | WhatsApp, Messenger, Telegram | ⬜ Pending |
