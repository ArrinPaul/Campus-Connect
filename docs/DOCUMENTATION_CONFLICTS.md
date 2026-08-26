# CAMPUS CONNECT — DOCUMENTATION CONFLICT REPORT

**Audit Date:** August 27, 2026  
**Auditor:** Forensic Codebase Engine  
**Objective:** Identify and reconcile every contradiction between project documentation and the actual codebase.

---

## 1. Documentation Contradiction Matrix

| Item | Document A (`FEATURES.md` / `TRACKER.md`) | Document B (`TASKS.md` / `AUDIT.md`) | Actual Source Code | Truth / Reconciliation |
| :--- | :--- | :--- | :--- | :--- |
| **Total Feature Count** | `FEATURES.md` header claims **240 features**. | `FEATURES.md` summary table enumerates **190 feature rows**. | Exactly **190 feature definitions** exist in the tables. | The number 240 was an arbitrary initial goal estimate; the canonical count is **190 features across 25 domains**. |
| **Phase 1 Task Progress** | `TRACKER.md` claims Phase 1 is **COMPLETED**. | `TASKS.md` shows Phase 1 tasks as **0/46 (Not Started)**. | 13 `src/server/db/*` modules and 113 API routes are fully written and passing type checks. | `TASKS.md` was frozen before work began. Phase 1 foundation is actually complete in code. |
| **WebRTC Video Calling** | `AUDIT.md` claims Video Calling is **✅ Working**. | `FEATURES.md` lists CA01-CA06 as **Stub**. | Code exists in `useWebRTC.ts` and `misc.ts`, but table `calls` is **missing from SQL migration**. | **BROKEN**. Cannot work at runtime without the `calls` database table. |
| **Gamification & Leaderboard** | `FEATURES.md` marks G01-G06 as **Done**. | `PLAN.md` mentions gamification as future. | `user_reputation` table exists in SQL migration, but **0 frontend pages, 0 API routes, 0 hooks** exist. | **MISSING**. Gamification has no functional application code. |
| **Admin Dashboard** | `FEATURES.md` marks AD01 as **TODO**. | `TRACKER.md` marks Admin as **COMPLETED**. | `src/app/(dashboard)/admin/dashboard/page.tsx` and `/api/admin/stats` exist with live RBAC. | **IMPLEMENTED**. Admin dashboard exists and queries live database counts. |
| **Web Push Notifications** | `FEATURES.md` marks PN01-PN05 as **Done**. | `TRACKER.md` lists Push as implemented. | `/api/push/subscribe` is an explicit stub returning `{ success: true }` without saving subscriptions. | **STUB / PARTIAL**. Frontend hook exists, but backend persistence is missing. |
| **Test Suite Health** | `AUDIT.md` claims **423/423 passed**. | `PROJECT_PROFILE.md` claims **3 failing suites**. | Live `npm test` executes **426 tests** (425 passed, 1 failed in `main-layout.test.tsx`). | Test suite expanded to 426 tests; currently 425 pass and 1 fails on an outdated CSS class assertion. |
| **Database Migration Path** | `run-migration.js` reads `supabase/migration.sql`. | `supabase/migrations/` contains `20240101000000_init.sql`. | Migration file is located at `supabase/migrations/20240101000000_init.sql`. | `run-migration.js` has a stale file path and fails if executed. |
| **Stripe & Ads Removal** | `TRACKER.md` notes Ads and Stripe **"❌ Removed per user"**. | `FEATURES.md` lists them as **TODO**. | 7 Ads API routes, 3 Subscriptions routes, and `ads` DB table exist in the codebase. | Ads are partially implemented in code; Subscriptions are 501 stubs. |

---

## 2. Obsolete Technology References

The following obsolete technology references were identified in documentation and have been purged:
1. **Neo4j Graph Database**: Referenced in historical design notes. Entirely replaced by Supabase PostgreSQL relational schema.
2. **Express.js API Server (`apps/api`)**: Replaced completely by Next.js App Router Route Handlers (`src/app/api/**`).
3. **Custom JWT Auth Handlers**: Replaced by `@supabase/ssr` cookie-based authentication and Edge middleware.
