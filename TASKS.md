# Campus Connect — Task Tracker

## Current Phase: Phase 0 — Cleanup & Documentation

---

## Phase 0: Cleanup & Documentation

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Delete `apps/api/` (Express.js server) | ✅ Done | |
| 0.2 | Delete `src/server/graph/` (Neo4j driver) | ✅ Done | |
| 0.3 | Delete `src/server/db/` (Neo4j modules) | ✅ Done | |
| 0.4 | Delete `src/lib/auth/session.ts` | ✅ Done | |
| 0.5 | Delete `src/lib/auth/server.ts` | ✅ Done | |
| 0.6 | Delete `src/lib/rate-limit.ts` + test | ✅ Done | |
| 0.7 | Delete `src/middleware.test.ts` | ✅ Done | |
| 0.8 | Delete `src/app/(dashboard)/discover/` | ✅ Done | Redirected to /explore |
| 0.9 | Delete outdated docs (MONOREPO_SETUP, README_MONOREPO, neo4j-redis-migration) | ✅ Done | |
| 0.10 | Delete `src/types/sentry-nextjs.d.ts` | ✅ Done | |
| 0.11 | Remove Convex shims from `src/lib/api.ts` | ✅ Done | ConvexReactClient, ConvexProvider, useConvexAuth |
| 0.12 | Create `PLAN.md` | ✅ Done | |
| 0.13 | Create `TASKS.md` | ✅ Done | |
| 0.14 | Create `TRACKER.md` | 🔄 In Progress | |

---

## Phase 1: Foundation (Next)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Set up Supabase project | ⬜ Todo | |
| 1.2 | Create PostgreSQL migration SQL | ⬜ Todo | All tables with RLS |
| 1.3 | Run migration in Supabase | ⬜ Todo | |
| 1.4 | Configure storage buckets | ⬜ Todo | images, videos, files |
| 1.5 | Install `@supabase/ssr` | ⬜ Todo | |
| 1.6 | Create `src/lib/supabase/client.ts` | ⬜ Todo | Browser client |
| 1.7 | Create `src/lib/supabase/server.ts` | ⬜ Todo | Server client |
| 1.8 | Create `src/lib/supabase/middleware.ts` | ⬜ Todo | Auth middleware |
| 1.9 | Rewrite `src/middleware.ts` | ⬜ Todo | Use Supabase middleware |
| 1.10 | Rewrite sign-in page | ⬜ Todo | Supabase Auth |
| 1.11 | Rewrite sign-up page | ⬜ Todo | Supabase Auth |
| 1.12 | Rewrite `src/lib/auth/client.tsx` | ⬜ Todo | Supabase hooks |
| 1.13 | Rewrite `src/server/db/users.ts` | ⬜ Todo | Supabase queries |
| 1.14 | Rewrite `src/server/db/posts.ts` | ⬜ Todo | Supabase queries |
| 1.15 | Rewrite `src/server/db/comments.ts` | ⬜ Todo | Supabase queries |
| 1.16 | Rewrite `src/server/db/reactions.ts` | ⬜ Todo | Supabase queries |
| 1.17 | Rewrite `src/server/db/messages.ts` | ⬜ Todo | Supabase queries |
| 1.18 | Rewrite `src/server/db/follows.ts` | ⬜ Todo | Supabase queries |
| 1.19 | Rewrite `src/server/db/communities.ts` | ⬜ Todo | Supabase queries |
| 1.20 | Rewrite `src/server/db/events-jobs.ts` | ⬜ Todo | Supabase queries |
| 1.21 | Rewrite `src/server/db/notifications.ts` | ⬜ Todo | Supabase queries |
| 1.22 | Rewrite `src/server/db/bookmarks.ts` | ⬜ Todo | Supabase queries |
| 1.23 | Rewrite `src/server/db/hashtags.ts` | ⬜ Todo | Supabase queries |
| 1.24 | Rewrite `src/server/db/content.ts` | ⬜ Todo | Supabase queries |
| 1.25 | Rewrite `src/server/db/misc.ts` | ⬜ Todo | Supabase queries |
| 1.26 | Rewrite all API routes to use new DB layer | ⬜ Todo | ~100 routes |
| 1.27 | Integrate Supabase Storage for media | ⬜ Todo | |
| 1.28 | Rewrite `api/media/upload-url` route | ⬜ Todo | |
| 1.29 | Remove `ignoreBuildErrors` from next.config.js | ⬜ Todo | |
| 1.30 | Enable `noImplicitAny: true` | ⬜ Todo | |
| 1.31 | Type the API client (replace `any`) | ⬜ Todo | |
| 1.32 | Fix CSP image allowlist | ⬜ Todo | |
| 1.33 | Add `.env.local` with Supabase keys | ⬜ Todo | |
| 1.34 | Update `.env.example` | ⬜ Todo | |

---

## Phase 2: Core Features (Planned)

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Rebuild GlobalNav with user context | ⬜ Todo | |
| 2.2 | Add notification badge to nav | ⬜ Todo | |
| 2.3 | Build mobile bottom nav | ⬜ Todo | |
| 2.4 | Rebuild landing page | ⬜ Todo | |
| 2.5 | Complete stories (video support) | ⬜ Todo | |
| 2.6 | Fix story navigation | ⬜ Todo | |
| 2.7 | Complete jobs (search/filters) | ⬜ Todo | |
| 2.8 | Complete research (advanced filters) | ⬜ Todo | |
| 2.9 | Enhance profiles (portfolio) | ⬜ Todo | |
| 2.10 | Build community settings page | ⬜ Todo | |

---

## Phase 3: Real-time (Planned)

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Set up Supabase Realtime | ⬜ Todo | |
| 3.2 | Live messaging | ⬜ Todo | |
| 3.3 | Live feed updates | ⬜ Todo | |
| 3.4 | Push notifications (Web Push) | ⬜ Todo | |
| 3.5 | Video/voice calls (WebRTC) | ⬜ Todo | |

---

## Phase 4: Monetization & Admin (Planned)

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Admin dashboard | ⬜ Todo | |
| 4.2 | Ads system | ⬜ Todo | |
| 4.3 | Premium subscriptions (Stripe) | ⬜ Todo | |

---

## Phase 5: Polish & Launch (Planned)

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Test coverage | ⬜ Todo | |
| 5.2 | Performance optimization | ⬜ Todo | |
| 5.3 | SEO & PWA | ⬜ Todo | |
| 5.4 | CI/CD pipeline | ⬜ Todo | |

---

## Blockers

| Blocker | Status | Notes |
|---|---|---|
| Supabase project not created | 🔴 Blocked | Need to create project before Phase 1 |
| No `.env.local` with keys | 🔴 Blocked | Need Supabase URL + anon key |
