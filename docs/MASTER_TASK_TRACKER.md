# MASTER TASK TRACKER — CAMPUS CONNECT REMAINING WORK CLASSIFICATION

**Tracker Version:** 2.0.0 (Phase 3 Reconciled)  
**Classification Rules:**  
- **P0 Critical**: Architectural blockers, broken database schemas, crashed execution paths, failing test suites.
- **P1 High**: Essential student-facing feature gaps, core CRUD incompleteness, active placeholder replacements.
- **P2 Medium**: Secondary interactions, search refinements, gamification UI, auxiliary settings.
- **P3 Low**: Monetization placeholders (Stripe, Ads pauses), minor ESLint warnings, dev tools.

---

## P0 Critical Tasks (Foundation Blockers — ALL RESOLVED IN PHASE 2)

| Task ID | Component | Problem | Status | Resolution / Verification |
|---|---|---|:---:|---|
| **P0-01** | Database Schema | Table `calls` missing from migration. | **✅ RESOLVED** | Added Table 38 (`calls`) with foreign keys, indexes, and RLS policies to `supabase/migrations/20240101000000_init.sql`. Verified in `tests/phase2-foundation.test.ts`. |
| **P0-02** | Database Schema | Column `is_resolved` missing from `questions`. | **✅ RESOLVED** | Added `is_resolved BOOLEAN DEFAULT FALSE` to `questions` table in migration. Verified in `tests/phase2-foundation.test.ts`. |
| **P0-03** | Database Query | Code filtered `jobs.employment_type` vs `jobs.type`. | **✅ RESOLVED** | Aligned query in `src/server/db/events-jobs.ts:L54` to filter on `type`. Verified in `tests/phase2-foundation.test.ts`. |
| **P0-04** | Unit Testing | `main-layout.test.tsx` padding assertion mismatch. | **✅ RESOLVED** | Updated test assertion to match `md:px-8` design system token; 45 suites, 451/451 tests pass (100%). |
| **P0-05** | Security | Hardcoded password in `setup-realtime.js`. | **✅ RESOLVED** | Replaced hardcoded connection URL with `process.env.DATABASE_URL`. Verified in `tests/phase2-foundation.test.ts`. |

---

## P1 High Tasks (Core Feature Completion)

| Task ID | Component | Problem | Status | Resolution / Verification |
|---|---|---|:---:|---|
| **P1-01** | Sidebar Widgets | `TrendingHashtags` static placeholder. | **✅ RESOLVED** | Live `TrendingHashtags.tsx` connected to `api.hashtags.getTrending` with loading/empty/list states. Verified in `TrendingHashtags.test.tsx`. |
| **P1-02** | Sidebar Widgets | `SuggestedUsers` static placeholder. | **✅ RESOLVED** | Live `SuggestedUsers.tsx` connected to `api.follows.getSuggestedUsers` with 1-click follow mutation. Verified in `SuggestedUsers.test.tsx`. |
| **P1-03** | Event Management | Event deletion and editing were 501 scaffold stubs. | **✅ RESOLVED** | Implemented `updateEvent` & `deleteEvent` in `events-jobs.ts` and routes `/api/events/delete`, `/api/events/update` with host auth. Verified in `phase3-integration.test.ts`. |
| **P1-04** | Job Management | Job deletion and applicant management were 501 stubs. | **✅ RESOLVED** | Implemented `updateJob`, `deleteJob`, and `getJobApplications` in `events-jobs.ts` and routes `/api/jobs/delete`, `/api/jobs/update`, `/api/jobs/job-applications` with poster auth. Verified in `phase3-integration.test.ts`. |
| **P1-05** | Q&A Voting | Question voting was a 501 stub (`/api/questions/vote`). | **✅ RESOLVED** | Implemented atomic `voteQuestion` in `content.ts` with toggle-off/switch logic and `/api/questions/vote`. Verified in `phase3-integration.test.ts`. |
| **P1-06** | Realtime Calls | WebRTC video/audio peer negotiation & media tracks. | **✅ RESOLVED** | Verified in browser environment via `tests/webrtc-browser-media.test.ts` (6 tests). |
| **P1-07** | Media Storage | PostComposer direct binary upload to Supabase storage. | **✅ RESOLVED** | Implemented direct binary upload via `/api/media/upload-url` in `PostComposer.tsx`, verified in `PostComposer.test.tsx`. |

---

## P2 Medium Tasks (Secondary Features & Polish)

| Task ID | Component | Problem | Why It Matters | Impacted Files | Acceptance Criteria | Tests Required |
|---|---|---|---|---|---|---|
| **P2-01** | Gamification | G01-G06 features have DB table `user_reputation` but 0 UI pages or hooks. | Student engagement and reputation tracking is inactive. | `src/app/(dashboard)/leaderboard/page.tsx` (new), `src/server/db/users.ts` | Leaderboard view showing top students ranked by reputation points. | Component test |
| **P2-02** | Push Notifications | Web Push subscription endpoint `/api/push/subscribe` is a stub. | Background browser notifications cannot be sent to offline students. | `src/app/api/push/subscribe/route.ts`, `src/hooks/usePushNotifications.ts` | Browser push subscription JSON is saved to `push_subscriptions` table. | Web Push test |
| **P2-03** | E2E Testing | Zero Playwright / Cypress automated browser tests exist. | Critical user journeys (Signup -> Feed -> DM -> Checkout) lack regression safety. | `e2e/` (new directory), `playwright.config.ts` | Automated end-to-end tests for Auth, Feed post creation, and Direct messaging. | `npm run test:e2e` |
| **P2-04** | Research Reviews | Research paper peer review and voting routes were 501 stubs. | **✅ RESOLVED** | Implemented in `content.ts`, `/api/research/review`, `/api/research/vote`, verified in `tests/research-review-vote.test.ts`. |
| **P2-05** | Marketplace Mutations | Marketplace update/delete mutations were 501 stubs. | **✅ RESOLVED** | Implemented in `misc.ts`, `/api/marketplace/update`, `/api/marketplace/delete`, verified in `tests/marketplace-mutations.test.ts`. |
| **P2-06** | Story Navigation | Story player lacks tap-left / tap-right transitions between user stories. | Story viewing UX requires manual close. | `src/app/(dashboard)/stories/[id]/page.tsx` | Keyboard arrow and click zone navigation auto-advances to next unviewed story. | Component test |

---

## P3 Low Tasks (Monetization & Housekeeping)

| Task ID | Component | Problem | Why It Matters | Impacted Files | Acceptance Criteria | Tests Required |
|---|---|---|---|---|---|---|
| **P3-01** | Stripe Subscriptions | Subscription and checkout routes are stubs. | Monetization is non-essential prior to campus user base validation. | `src/app/api/subscriptions/*` | Stripe Checkout session and webhook handler implemented when payment gateway configured. | Stripe mock test |
| **P3-02** | ESLint Warnings | 2 `<img>` warnings in `ChatInput.tsx` and `ChatMessage.tsx`. | Optimization hygiene for next/image. | `src/app/(components)/messages/ChatInput.tsx`, `ChatMessage.tsx` | Replaced with Next.js `<Image />` or `OptimizedImage`. | `npm run lint` clean |
| **P3-03** | Ad Campaign Pausing | `/api/ads/pause` is a 501 scaffold stub. | Advertisers cannot pause active campaigns. | `src/app/api/ads/pause/route.ts` | Campaign status toggles between `active` and `paused`. | API test |
| **P3-04** | Migration Script | `run-migration.js` path mismatch. | **✅ RESOLVED** | `run-migration.js` | Updated path to canonical `supabase/migrations/20240101000000_init.sql`. | Migration runner check |
