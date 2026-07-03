# Tracker

**240 features. Updated as work progresses.**
See FEATURES.md for full descriptions of each feature.

---

## Design System
DESIGN.md = source of truth. Meta/Facebook design. `tailwind.config.ts` mirrors it.

---

## Progress

| Domain | Done | Rebuild | TODO | Stub | Total |
|---|---|---|---|---|---|
| Auth & Onboarding | 7 | 4 | 0 | 0 | 11 |
| User System | 13 | 2 | 0 | 2 | 17 |
| Feed & Posts | 14 | 0 | 0 | 0 | 14 |
| Reactions & Engagement | 8 | 0 | 0 | 0 | 8 |
| Bookmarks | 4 | 0 | 0 | 0 | 4 |
| Polls | 5 | 0 | 0 | 0 | 5 |
| Hashtags | 4 | 0 | 0 | 0 | 4 |
| Messages | 12 | 0 | 0 | 0 | 12 |
| Communities | 14 | 0 | 0 | 0 | 14 |
| Events | 7 | 0 | 0 | 0 | 7 |
| Jobs | 6 | 0 | 1 | 0 | 7 |
| Marketplace | 8 | 0 | 0 | 0 | 8 |
| Q&A | 8 | 0 | 0 | 0 | 8 |
| Research | 6 | 0 | 0 | 0 | 6 |
| Resources | 5 | 0 | 0 | 0 | 5 |
| Stories | 6 | 0 | 2 | 0 | 8 |
| Notifications | 6 | 0 | 0 | 0 | 6 |
| Gamification | 6 | 0 | 0 | 0 | 6 |
| Settings | 5 | 0 | 0 | 0 | 5 |
| Search | 5 | 0 | 0 | 0 | 5 |
| Navigation | 3 | 3 | 0 | 0 | 6 |
| Calls | 0 | 0 | 0 | 6 | 6 |
| Push Notifications | 5 | 0 | 0 | 0 | 5 |
| Graph Recs | 0 | 4 | 0 | 0 | 4 |
| Admin & Monetization | 0 | 0 | 9 | 0 | 9 |
| **TOTAL** | **154** | **17** | **13** | **8** | **240** |

**154 done (64%) | 17 need rebuild | 13 TODO | 8 stubs**

---

## Phase 0: Cleanup ✅

| Task | Status |
|---|---|
| Delete apps/api/ (Express server) | ✅ |
| Delete src/server/ (Neo4j DB + graph) | ✅ |
| Delete old auth files (session.ts, server.ts, password.ts) | ✅ |
| Delete rate limiter + tests | ✅ |
| Delete discover redirect page | ✅ |
| Delete outdated docs | ✅ |
| Delete sentry types | ✅ |
| Remove Convex shims from api.ts | ✅ |
| Update tailwind.config.ts to match DESIGN.md | ✅ |
| Create FEATURES.md | ✅ |
| Create TRACKER.md | ✅ |

---

## Phase 1: Foundation ⬜ NEXT

### Supabase Setup
| Task | Status |
|---|---|
| Create Supabase project | ⬜ |
| Create SQL migration (all tables + RLS) | ⬜ |
| Create storage buckets | ⬜ |
| Add keys to .env.local | ⬜ |
| Update .env.example | ⬜ |

### Auth (A01-A04, A11 — 5 features)
| Task | Status |
|---|---|
| Install @supabase/ssr | ⬜ |
| Create src/lib/supabase/client.ts | ⬜ |
| Create src/lib/supabase/server.ts | ⬜ |
| Create src/lib/supabase/middleware.ts | ⬜ |
| Rewrite src/middleware.ts | ⬜ |
| Rewrite sign-in page | ⬜ |
| Rewrite sign-up page | ⬜ |
| Rewrite src/lib/auth/client.tsx | ⬜ |

### Database Layer (14 modules)
| Task | Status |
|---|---|
| Create src/server/db/users.ts | ⬜ |
| Create src/server/db/posts.ts | ⬜ |
| Create src/server/db/comments.ts | ⬜ |
| Create src/server/db/reactions.ts | ⬜ |
| Create src/server/db/messages.ts | ⬜ |
| Create src/server/db/follows.ts | ⬜ |
| Create src/server/db/communities.ts | ⬜ |
| Create src/server/db/events-jobs.ts | ⬜ |
| Create src/server/db/notifications.ts | ⬜ |
| Create src/server/db/bookmarks.ts | ⬜ |
| Create src/server/db/hashtags.ts | ⬜ |
| Create src/server/db/content.ts | ⬜ |
| Create src/server/db/misc.ts | ⬜ |

### API Routes (~100 routes)
| Task | Status |
|---|---|
| Rewrite auth routes (4 routes) | ⬜ |
| Rewrite user routes (8 routes) | ⬜ |
| Rewrite post routes (8 routes) | ⬜ |
| Rewrite comment routes (3 routes) | ⬜ |
| Rewrite reaction routes (4 routes) | ⬜ |
| Rewrite message routes (4 routes) | ⬜ |
| Rewrite conversation routes (5 routes) | ⬜ |
| Rewrite community routes (10 routes) | ⬜ |
| Rewrite event routes (5 routes) | ⬜ |
| Rewrite job routes (4 routes) | ⬜ |
| Rewrite story routes (3 routes) | ⬜ |
| Rewrite notification routes (4 routes) | ⬜ |
| Rewrite bookmark routes (4 routes) | ⬜ |
| Rewrite remaining routes (30+ routes) | ⬜ |

### Config
| Task | Status |
|---|---|
| Remove ignoreBuildErrors from next.config.js | ⬜ |
| Enable noImplicitAny: true | ⬜ |
| Type the API client (replace any) | ⬜ |
| Fix CSP image allowlist | ⬜ |

---

## Phase 2: Core Features ⬜

| Task | Status |
|---|---|
| Rebuild GlobalNav (L01 — user avatar, notification badge) | ⬜ |
| Build mobile nav (L03 — hamburger menu) | ⬜ |
| Rebuild landing page (L06 — real content) | ⬜ |
| Add video stories (ST07) | ⬜ |
| Fix story navigation (ST08) | ⬜ |
| Add job search/filters (J07) | ⬜ |
| Build community settings (C15 — moderation) | ⬜ |
| Add portfolio section (U18 — projects, certs) | ⬜ |
| Rebuild graph recs (GR01-GR04) | ⬜ |

---

## Phase 3: Real-time ⬜

| Task | Status |
|---|---|
| Set up Supabase Realtime | ⬜ |
| Live messaging (M13 — real-time delivery) | ⬜ |
| Live feed updates (F15 — new posts appear) | ⬜ |
| Live typing indicators (M14 — Supabase Realtime) | ⬜ |
| Push notifications (PN06 — server-side send) | ⬜ |

---

## Phase 4: Calls & Video ⬜

| Task | Status |
|---|---|
| WebRTC signaling via Supabase Realtime | ⬜ |
| Build call modal UI (CA01-CA06) | ⬜ |
| Voice call implementation | ⬜ |
| Video call implementation | ⬜ |
| Screen sharing | ⬜ |

---

## Phase 5: Admin & Monetization ⬜

| Task | Status |
|---|---|
| Admin dashboard (AD01 — real stats) | ⬜ |
| User management panel | ⬜ |
| Content moderation tools | ⬜ |
| Ads system (AD02-AD06) | ⬜ |
| Stripe subscriptions (AD07-AD09) | ⬜ |

---

## Phase 6: Polish & Launch ⬜

| Task | Status |
|---|---|
| API route tests | ⬜ |
| Component tests update | ⬜ |
| E2E tests (Playwright) | ⬜ |
| Performance optimization | ⬜ |
| SEO (meta, sitemap, robots) | ⬜ |
| PWA (service worker, offline) | ⬜ |
| CI/CD pipeline | ⬜ |
