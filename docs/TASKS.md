# Tasks

## How to Read This
- ✅ = Done
- 🔄 = In Progress
- ⬜ = Not Started
- 🔴 = Blocked

---

## Phase 0: Cleanup ✅

| # | Task | Status |
|---|---|---|
| 0.1 | Delete `apps/api/` (Express server) | ✅ |
| 0.2 | Delete `src/server/` (Neo4j DB + graph) | ✅ |
| 0.3 | Delete old auth files (session.ts, server.ts, password.ts) | ✅ |
| 0.4 | Delete rate limiter + tests | ✅ |
| 0.5 | Delete discover redirect page | ✅ |
| 0.6 | Delete outdated docs | ✅ |
| 0.7 | Delete sentry types | ✅ |
| 0.8 | Remove Convex shims from api.ts | ✅ |
| 0.9 | Create PLAN.md | ✅ |
| 0.10 | Create TASKS.md | ✅ |
| 0.11 | Create TRACKER.md | ✅ |

---

## Phase 1: Foundation

### Supabase Setup
| # | Task | Status |
|---|---|---|
| 1.1 | Create Supabase project | ⬜ |
| 1.2 | Create database tables (SQL migration) | ⬜ |
| 1.3 | Set up Row Level Security policies | ⬜ |
| 1.4 | Create storage buckets (images, videos, files) | ⬜ |
| 1.5 | Add Supabase keys to `.env.local` | ⬜ |

### Auth System
| # | Task | Status |
|---|---|---|
| 1.6 | Install `@supabase/ssr` | ⬜ |
| 1.7 | Create `src/lib/supabase/client.ts` (browser) | ⬜ |
| 1.8 | Create `src/lib/supabase/server.ts` (server) | ⬜ |
| 1.9 | Create `src/lib/supabase/middleware.ts` | ⬜ |
| 1.10 | Rewrite `src/middleware.ts` | ⬜ |
| 1.11 | Rewrite sign-in page | ⬜ |
| 1.12 | Rewrite sign-up page | ⬜ |
| 1.13 | Rewrite `src/lib/auth/client.tsx` | ⬜ |

### Database Layer
| # | Task | Status |
|---|---|---|
| 1.14 | Create `src/server/db/users.ts` | ⬜ |
| 1.15 | Create `src/server/db/posts.ts` | ⬜ |
| 1.16 | Create `src/server/db/comments.ts` | ⬜ |
| 1.17 | Create `src/server/db/reactions.ts` | ⬜ |
| 1.18 | Create `src/server/db/messages.ts` | ⬜ |
| 1.19 | Create `src/server/db/follows.ts` | ⬜ |
| 1.20 | Create `src/server/db/communities.ts` | ⬜ |
| 1.21 | Create `src/server/db/events-jobs.ts` | ⬜ |
| 1.22 | Create `src/server/db/notifications.ts` | ⬜ |
| 1.23 | Create `src/server/db/bookmarks.ts` | ⬜ |
| 1.24 | Create `src/server/db/hashtags.ts` | ⬜ |
| 1.25 | Create `src/server/db/content.ts` (stories, resources, papers) | ⬜ |
| 1.26 | Create `src/server/db/misc.ts` (polls, reposts, presence, ads, gamification) | ⬜ |

### API Routes
| # | Task | Status |
|---|---|---|
| 1.27 | Rewrite auth routes (sign-up, sign-in, sign-out, session) | ⬜ |
| 1.28 | Rewrite user routes (me, profile, search, skills, settings) | ⬜ |
| 1.29 | Rewrite post routes (CRUD, feed, explore) | ⬜ |
| 1.30 | Rewrite comment routes | ⬜ |
| 1.31 | Rewrite reaction routes | ⬜ |
| 1.32 | Rewrite message routes | ⬜ |
| 1.33 | Rewrite conversation routes | ⬜ |
| 1.34 | Rewrite community routes | ⬜ |
| 1.35 | Rewrite event routes | ⬜ |
| 1.36 | Rewrite job routes | ⬜ |
| 1.37 | Rewrite story routes | ⬜ |
| 1.38 | Rewrite notification routes | ⬜ |
| 1.39 | Rewrite bookmark routes | ⬜ |
| 1.40 | Rewrite remaining routes (hashtags, search, gamification, etc.) | ⬜ |

### Media & Config
| # | Task | Status |
|---|---|---|
| 1.41 | Integrate Supabase Storage for media uploads | ⬜ |
| 1.42 | Remove `ignoreBuildErrors` from next.config.js | ⬜ |
| 1.43 | Enable `noImplicitAny: true` in tsconfig | ⬜ |
| 1.44 | Type the API client (replace `any`) | ⬜ |
| 1.45 | Fix CSP image allowlist | ⬜ |
| 1.46 | Update `.env.example` | ⬜ |

---

## Phase 2: Core Features

| # | Task | Status |
|---|---|---|
| 2.1 | Rebuild GlobalNav (user avatar, notification badge) | ⬜ |
| 2.2 | Build mobile bottom navigation | ⬜ |
| 2.3 | Rebuild landing page | ⬜ |
| 2.4 | Add video support to stories | ⬜ |
| 2.5 | Fix story navigation (prev/next) | ⬜ |
| 2.6 | Add job search and filters | ⬜ |
| 2.7 | Add advanced research paper filters | ⬜ |
| 2.8 | Add portfolio section to profiles | ⬜ |
| 2.9 | Build community settings page | ⬜ |

---

## Phase 3: Real-time

| # | Task | Status |
|---|---|---|
| 3.1 | Set up Supabase Realtime | ⬜ |
| 3.2 | Live messaging | ⬜ |
| 3.3 | Live feed updates | ⬜ |
| 3.4 | Push notifications (Web Push) | ⬜ |
| 3.5 | Video/voice calls (WebRTC) | ⬜ |

---

## Phase 4: Monetization

| # | Task | Status |
|---|---|---|
| 4.1 | Admin dashboard | ⬜ |
| 4.2 | Ads system | ⬜ |
| 4.3 | Premium subscriptions (Stripe) | ⬜ |

---

## Phase 5: Launch

| # | Task | Status |
|---|---|---|
| 5.1 | Add test coverage | ⬜ |
| 5.2 | Performance optimization | ⬜ |
| 5.3 | SEO setup | ⬜ |
| 5.4 | CI/CD pipeline | ⬜ |

---

## Progress

**Total: 11/60 tasks done (18%)**
- Phase 0: 11/11 ✅
- Phase 1: 0/46 ⬜
- Phase 2: 0/9 ⬜
- Phase 3: 0/5 ⬜
- Phase 4: 0/3 ⬜
- Phase 5: 0/4 ⬜
