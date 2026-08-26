# Campus Connect — Technical Architecture & Execution Plan

## 1. Vision & Architecture

A unified academic and social platform for college communities merging:
- **WhatsApp**: Direct messaging, group chats, live typing indicators, and presence status.
- **Facebook**: Ranked feed, rich post authoring, threaded comments, emoji reactions, communities, events, marketplace.
- **Discord**: Topic channels, community member roles, and real-time broadcasts.
- **LinkedIn**: Academic profiles, skill endorsements, career job board, preprints/papers, and study resources.

```
Frontend:   Next.js 14.2.25 (App Router) + React 18.3.1 + TypeScript 5
Styling:    Tailwind CSS 3.4.1 (Meta/Facebook Design System per meta/DESIGN.md)
Components: Radix UI (21 primitives) + TipTap Rich Text (KaTeX LaTeX + Code blocks)
State:      TanStack React Query 5.90.21 (@/lib/api.ts) + Zustand 5.0.11
Data Layer: 13 Server Database Modules (src/server/db/*) using Supabase Server Client
Database:   Supabase PostgreSQL (37 tables, 27 indexes, 119 RLS policies)
Auth:       Supabase SSR Auth (@supabase/ssr) with Cookie Session Refresh Middleware
Realtime:   Supabase Realtime (Postgres Changes, Presence, Broadcast)
Testing:    Jest (426 tests, 425 passing), Testing Library, fast-check property testing
Monitoring: Sentry 10.56.0 + PostHog 1.352.0
```

---

## 2. Current Implementation State (August 2026 Audit)

| Layer | Status | Key Evidence |
| :--- | :---: | :--- |
| **Authentication** | **100% Complete** | Sign-in, Sign-up, Sign-out, 3-step onboarding wizard, session cookies, soft-delete checks, admin RBAC. |
| **Database Layer** | **95% Complete** | 13 server modules in `src/server/db/` complete with atomic RPC increments and Redis cache. 3 schema fixes needed. |
| **API Endpoints** | **82% Complete** | 113 fully functional route handlers, 54 501 scaffold stubs, 4 cron/push placeholders. |
| **Frontend UI** | **90% Complete** | 26 dashboard views, full responsive design, dark/light themes, skeletons, error boundaries. |
| **Realtime Engine** | **85% Complete** | Live chat, typing indicators, live feed invalidation, and notification broadcasts working. |
| **WebRTC Calls** | **Blocked** | UI components and signaling hooks complete; execution blocked by missing `calls` table in SQL migration. |
| **Gamification** | **0% Built** | Documented as historical goal; DB table `user_reputation` exists, UI/API unbuilt. |
| **Testing** | **80% Complete** | 425 of 426 tests passing, 0 TypeScript compilation errors. Playwright E2E tests pending. |

---

## 3. Phased Execution Roadmap

### Phase 0: Cleanup & Architecture Migration ✅ COMPLETED
- Deleted legacy Express (`apps/api`) and Neo4j database layers.
- Consolidated on Next.js 14 App Router and Supabase PostgreSQL.
- Aligned Tailwind tokens with `meta/DESIGN.md`.

### Phase 1: Foundation & Data Layer ✅ COMPLETED
- Configured Supabase PostgreSQL schema with 37 tables, 27 indexes, and 119 RLS policies.
- Implemented `@supabase/ssr` authentication and edge middleware.
- Built 13 server-only database access modules (`src/server/db/`).
- Connected 113 core API route handlers.

### Phase 2: Core Academic & Social Features ✅ COMPLETED
- **Feed**: In-memory ranking algorithm combining affinity, log10 engagement, and time decay.
- **Posts**: LaTeX equation rendering, code syntax highlighting, poll voting, link previews, reposts, bookmarks.
- **Communities**: Category browse, custom slugs, member role governance, and invite workflows.
- **Academic Hub**: Q&A voting/answers, Research paper repository, Course study resources.
- **Commerce & Careers**: Campus marketplace with mark-as-sold flow; Job board with application tracking.

### Phase 3: Real-Time Engine & Presence ✅ COMPLETED
- Supabase Realtime integration for instant direct and group messaging (`postgres_changes`).
- Live typing indicator synchronization via Supabase Presence API.
- Live feed update notifications and in-app notification toasts (`useRealtimeNotifications`).
- 60-second client presence heartbeat (`useHeartbeat`).

### Phase 4: Integrations, Calls & Schema Patches 🔄 IN PROGRESS (CURRENT)
- [ ] **P0**: Add `calls` table to `supabase/migrations/20240101000000_init.sql`.
- [ ] **P0**: Add `is_resolved` column to `questions` table in schema.
- [ ] **P0**: Fix `jobs.employment_type` column reference in `src/server/db/events-jobs.ts` to `type`.
- [ ] **P0**: Update `main-layout.test.tsx` padding class expectation (`md:px-8`) for 100% test pass rate.
- [ ] **P1**: Complete WebRTC video/audio peer negotiation testing via `useWebRTC` hook.
- [ ] **P1**: Replace hardcoded database password in `setup-realtime.js` with environment variable.

### Phase 5: Secondary CRUD & Stubs Resolution ⬜ NEXT
- Implement high-value 501 scaffolded route handlers:
  - Event deletion and modification (`/api/events/delete`, `/api/events/update`).
  - Job posting management and applicant reviews (`/api/jobs/update`, `/api/jobs/delete`, `/api/jobs/job-applications`).
  - Q&A search, question deletion, and voting (`/api/questions/vote`, `/api/questions/search`).
  - Research paper reviews and ratings (`/api/research/review`, `/api/research/vote`).
- Wire `TrendingHashtags` and `SuggestedUsers` sidebar widgets to live APIs.

### Phase 6: Production Hardening & Launch ⬜ PENDING
- Build Playwright E2E automated test suite for critical user journeys (Registration, Feed, Chat, Purchase).
- Connect Web Push notification persistence for background device notifications.
- Execute Lighthouse performance audits, database query plan optimization, and staging verification.
- Production deployment on Vercel with custom domain and SSL.
