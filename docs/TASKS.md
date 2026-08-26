# Campus Connect — Implementation Task Tracker

## Legend
- ✅ = Completed & Verified in Codebase
- 🔄 = In Progress / Partial
- ⬜ = Pending / Not Started
- 🔴 = Blocked by Dependency

---

## Phase 0: Cleanup & Architecture Migration ✅

| # | Task | Status | Notes |
|---|---|:---:|---|
| 0.1 | Delete `apps/api/` (Legacy Express server) | ✅ | Removed |
| 0.2 | Delete `src/server/` legacy Neo4j code | ✅ | Removed |
| 0.3 | Delete obsolete auth handlers | ✅ | Replaced with Supabase SSR |
| 0.4 | Clean obsolete rate limiters | ✅ | Moved to Next.js middleware |
| 0.5 | Remove Convex shims from `src/lib/api.ts` | ✅ | Replaced with TanStack Query |
| 0.6 | Establish `meta/DESIGN.md` token system | ✅ | Configured in `tailwind.config.ts` |

---

## Phase 1: Foundation & Data Access Layer ✅

### Supabase & Schema Setup
| # | Task | Status | Notes |
|---|---|:---:|---|
| 1.1 | Create SQL migration with 37 tables | ✅ | `supabase/migrations/20240101000000_init.sql` |
| 1.2 | Configure Row Level Security (119 policies) | ✅ | Verified in migration |
| 1.3 | Create storage buckets (`media`, `avatars`) | ✅ | Configured in migration |
| 1.4 | Add schema patch for `calls` table | 🔄 | Pending migration addition |
| 1.5 | Add `is_resolved` column to `questions` table | 🔄 | Pending migration addition |

### Authentication & Middleware
| # | Task | Status | Notes |
|---|---|:---:|---|
| 1.6 | Create browser client (`src/lib/supabase/client.ts`) | ✅ | `@supabase/ssr` |
| 1.7 | Create server & admin clients (`src/lib/supabase/server.ts`) | ✅ | Cookie & Bearer auth + RLS bypass |
| 1.8 | Create session middleware (`src/lib/supabase/middleware.ts`) | ✅ | Token refresh & soft-delete check |
| 1.9 | Configure rate limiting middleware (`src/middleware.ts`) | ✅ | 120 req/min sliding window |
| 1.10 | Build 3-step onboarding flow (`src/app/(onboarding)/`) | ✅ | Name, handle, role, skills |
| 1.11 | Build Sign-in & Sign-up pages (`src/app/(auth)/`) | ✅ | Password auth with validation |

### Server Database Modules (`src/server/db/`)
| # | Task | Status | Notes |
|---|---|:---:|---|
| 1.12 | `users.ts` (Profiles, skills, Redis cache) | ✅ | Implemented & verified |
| 1.13 | `posts.ts` (Ranked feed, explore, CRUD, atomic RPC) | ✅ | Implemented & verified |
| 1.14 | `comments.ts` (Threaded replies, counter sync) | ✅ | Implemented & verified |
| 1.15 | `reactions.ts` (6 reaction types, counter sync) | ✅ | Implemented & verified |
| 1.16 | `messages.ts` (DMs, groups, unread counts) | ✅ | Implemented & verified |
| 1.17 | `follows.ts` (Social graph, Redis cache) | ✅ | Implemented & verified |
| 1.18 | `communities.ts` (Slug generation, roles, invites) | ✅ | Implemented & verified |
| 1.19 | `events-jobs.ts` (Events, RSVPs, jobs, applications) | ✅ | Implemented & verified |
| 1.20 | `notifications.ts` (Notifications, Realtime broadcast) | ✅ | Implemented & verified |
| 1.21 | `bookmarks.ts` (Bookmark collections) | ✅ | Implemented & verified |
| 1.22 | `hashtags.ts` (Trending tag calculator) | ✅ | Implemented & verified |
| 1.23 | `content.ts` (Stories, research papers, study resources, Q&A) | ✅ | Implemented & verified |
| 1.24 | `misc.ts` (Polls, reposts, presence, marketplace, ads) | ✅ | Implemented & verified |

---

## Phase 2: Core Academic & Social Features ✅

| # | Task | Status | Notes |
|---|---|:---:|---|
| 2.1 | Post creation with LaTeX formula & code formatting | ✅ | `PostComposer.tsx`, `KaTeX` |
| 2.2 | In-memory affinity and decay feed ranking | ✅ | `/api/posts/feed` |
| 2.3 | Direct messaging & Group conversation interface | ✅ | `ChatWindow.tsx`, `ChatArea.tsx` |
| 2.4 | Community directory, profile, and invite flow | ✅ | `/c/[slug]`, `/communities` |
| 2.5 | Campus events directory and RSVP system | ✅ | `/events`, `EventCard.tsx` |
| 2.6 | Job and internship board with application submitter | ✅ | `/jobs`, `JobCard.tsx` |
| 2.7 | Campus peer-to-peer marketplace | ✅ | `/marketplace`, `ListingCard.tsx` |
| 2.8 | Academic Q&A forum with answer acceptance | ✅ | `/q-and-a`, `QuestionCard.tsx` |
| 2.9 | Research preprint repository and PDF preview | ✅ | `/research`, `ResearchPaperCard.tsx` |
| 2.10 | Course study materials and download tracking | ✅ | `/resources`, `ResourceCard.tsx` |
| 2.11 | 24-hour expiring story system | ✅ | `/stories`, `StoryComposer.tsx` |
| 2.12 | Notification center with unread bell badge | ✅ | `/notifications`, `NotificationBell.tsx` |
| 2.13 | Universal search across posts, people, communities | ✅ | `/search`, `universalSearch` |

---

## Phase 3: Realtime Engine & Presence ✅

| # | Task | Status | Notes |
|---|---|:---:|---|
| 3.1 | Realtime chat updates via `postgres_changes` | ✅ | `useRealtimeMessages.ts` |
| 3.2 | Realtime typing indicators via Supabase Presence | ✅ | `useTypingIndicator.ts` |
| 3.3 | Live feed post invalidation | ✅ | `useRealtimeFeed.ts` |
| 3.4 | In-app notification toast broadcast | ✅ | `useRealtimeNotifications.ts` |
| 3.5 | 60-second presence heartbeat | ✅ | `useHeartbeat.ts`, `/api/presence` |

---

## Phase 4: Integrations, Calls & Schema Patches 🔄

| # | Task | Status | Notes |
|---|---|:---:|---|
| 4.1 | Add `calls` table with RLS to database migration | 🔄 | P0 fix for WebRTC persistence |
| 4.2 | Fix `questions.is_resolved` column in schema | 🔄 | P0 fix for Q&A accept |
| 4.3 | Fix `jobs.employment_type` reference in `events-jobs.ts` | 🔄 | P0 fix for job filter |
| 4.4 | Update `main-layout.test.tsx` padding assertion | 🔄 | Fix 1 failing test (`md:px-8`) |
| 4.5 | WebRTC audio/video call integration verification | 🔄 | `useWebRTC.ts`, `CallModal.tsx` |
| 4.6 | Remove hardcoded DB password from `setup-realtime.js` | 🔄 | Security hygiene fix |

---

## Phase 5: Secondary CRUD & Stub Implementations ⬜

| # | Task | Status | Notes |
|---|---|:---:|---|
| 5.1 | Implement event delete and update route handlers | ⬜ | `/api/events/delete`, `/api/events/update` |
| 5.2 | Implement job applicant review and update routes | ⬜ | `/api/jobs/update`, `/api/jobs/delete` |
| 5.3 | Implement question voting and deletion routes | ⬜ | `/api/questions/vote`, `/api/questions/delete` |
| 5.4 | Implement research paper review and voting routes | ⬜ | `/api/research/review`, `/api/research/vote` |
| 5.5 | Wire `TrendingHashtags` sidebar widget | ⬜ | Connect to `/api/hashtags/trending` |
| 5.6 | Wire `SuggestedUsers` sidebar widget | ⬜ | Connect to `/api/follows/suggestions` |
| 5.7 | Build Gamification leaderboard view & badges | ⬜ | UI for `user_reputation` |

---

## Phase 6: Production Hardening & E2E Testing ⬜

| # | Task | Status | Notes |
|---|---|:---:|---|
| 6.1 | Configure Playwright E2E test framework | ⬜ | Auth, Feed, Chat flows |
| 6.2 | Wire Web Push VAPID subscription persistence | ⬜ | Background device notifications |
| 6.3 | Optimize DB indexes and verify slow query logs | ⬜ | PostgreSQL performance |
| 6.4 | Sentry and PostHog production telemetry validation | ⬜ | Error & metric tracking |
| 6.5 | Staging deployment and domain verification | ⬜ | Production readiness |

---

## Summary Progress

- **Phase 0 (Cleanup):** 6/6 (100%) ✅
- **Phase 1 (Foundation):** 22/24 (91.6%) ✅
- **Phase 2 (Core Features):** 13/13 (100%) ✅
- **Phase 3 (Realtime):** 5/5 (100%) ✅
- **Phase 4 (Calls & Patches):** 0/6 (0% - Active) 🔄
- **Phase 5 (Secondary CRUD):** 0/7 (0%) ⬜
- **Phase 6 (Production & E2E):** 0/5 (0%) ⬜
- **Overall Completion:** **46/66 Major Task Milestones (69.7% of total lifecycle, ~78% of application code)**
