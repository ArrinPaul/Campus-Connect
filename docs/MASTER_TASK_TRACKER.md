# MASTER TASK TRACKER — REMAINING WORK CLASSIFICATION

**Tracker Version:** 1.0.0 (Phase 1 Baseline)  
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
| **P0-04** | Unit Testing | `main-layout.test.tsx` padding assertion mismatch. | **✅ RESOLVED** | Updated test assertion to match `md:px-8` design system token; 42 suites, 436/436 tests pass (100%). |
| **P0-05** | Security | Hardcoded password in `setup-realtime.js`. | **✅ RESOLVED** | Replaced hardcoded connection URL with `process.env.DATABASE_URL`. Verified in `tests/phase2-foundation.test.ts`. |

---

## P1 High Tasks (Core Feature Completion)

| Task ID | Component | Problem | Why It Matters | Impacted Files | Acceptance Criteria | Tests Required |
|---|---|---|---|---|---|---|
| **P1-01** | Realtime Calls | WebRTC video/audio peer negotiation unverified end-to-end. | Realtime calling is a core campus communication pillar. | `src/hooks/useWebRTC.ts`, `src/components/calls/CallModal.tsx` | Two clients can successfully exchange SDP offer/answer over Supabase broadcast and render remote stream. | WebRTC peer mock test |
| **P1-02** | Sidebar Widgets | `TrendingHashtags` and `SuggestedUsers` render "Coming Soon" static placeholders. | Key discovery surfaces on desktop feed are unpopulated. | `src/components/trending/TrendingHashtags.tsx`, `src/components/discover/SuggestedUsers.tsx` | Components call `api.hashtags.getTrending` and `api.follows.getSuggestedUsers` with skeleton loaders. | Widget component tests |
| **P1-03** | Event Management | Event deletion and editing are 501 scaffold stubs. | Event organizers cannot modify or cancel hosted events. | `src/app/api/events/delete/route.ts`, `src/app/api/events/update/route.ts` | Authorized event hosts can execute PATCH and DELETE mutations. | API route tests |
| **P1-04** | Job Management | Job deletion and applicant management are 501 scaffold stubs. | Employers/clubs cannot view applicants or close listings. | `src/app/api/jobs/delete/route.ts`, `src/app/api/jobs/job-applications/route.ts` | Job creators can review submitted applicant cover letters and delete postings. | API route tests |
| **P1-05** | Q&A Voting | Question voting is a 501 scaffold stub (`/api/questions/vote`). | Students cannot upvote good questions to surface them. | `src/app/api/questions/vote/route.ts` | Upvotes increment `questions.vote_count` atomically. | API route test |
| **P1-06** | Media Storage | PostComposer has placeholder comment for file upload wiring. | Posts with images/attachments depend on client upload completion. | `src/components/posts/PostComposer.tsx`, `src/app/api/media/upload-url/route.ts` | Uploads binary directly to Supabase signed URL and attaches public URL to post payload. | Media upload integration test |

---

## P2 Medium Tasks (Secondary Features & Polish)

| Task ID | Component | Problem | Why It Matters | Impacted Files | Acceptance Criteria | Tests Required |
|---|---|---|---|---|---|---|
| **P2-01** | Gamification | G01-G06 features have DB table `user_reputation` but 0 UI pages or hooks. | Student engagement and reputation tracking is inactive. | `src/app/(dashboard)/leaderboard/page.tsx` (new), `src/server/db/users.ts` | Leaderboard view showing top students ranked by reputation points. | Component test |
| **P2-02** | Push Notifications | Web Push subscription endpoint `/api/push/subscribe` is a stub. | Background browser notifications cannot be sent to offline students. | `src/app/api/push/subscribe/route.ts`, `src/hooks/usePushNotifications.ts` | Browser push subscription JSON is saved to `push_subscriptions` table. | Web Push test |
| **P2-03** | E2E Testing | Zero Playwright / Cypress automated browser tests exist. | Critical user journeys (Signup -> Feed -> DM -> Checkout) lack regression safety. | `e2e/` (new directory), `playwright.config.ts` | Automated end-to-end tests for Auth, Feed post creation, and Direct messaging. | `npm run test:e2e` |
| **P2-04** | Research Reviews | Research paper peer review and voting routes are 501 stubs. | Scholarly feedback on preprints is limited to reading. | `src/app/api/research/review/route.ts`, `src/app/api/research/vote/route.ts` | Students/faculty can submit structured peer reviews and votes. | API test |
| **P2-05** | Story Navigation | Story player lacks tap-left / tap-right transitions between user stories. | Story viewing UX requires manual close. | `src/app/(dashboard)/stories/[id]/page.tsx` | Keyboard arrow and click zone navigation auto-advances to next unviewed story. | Component test |

---

## P3 Low Tasks (Monetization & Housekeeping)

| Task ID | Component | Problem | Why It Matters | Impacted Files | Acceptance Criteria | Tests Required |
|---|---|---|---|---|---|---|
| **P3-01** | Stripe Subscriptions | Subscription and checkout routes are stubs. | Monetization is non-essential prior to campus user base validation. | `src/app/api/subscriptions/*` | Stripe Checkout session and webhook handler implemented when payment gateway configured. | Stripe mock test |
| **P3-02** | ESLint Warnings | 2 `<img>` warnings in `ChatInput.tsx` and `ChatMessage.tsx`. | Optimization hygiene for next/image. | `src/app/(components)/messages/ChatInput.tsx`, `ChatMessage.tsx` | Replaced with Next.js `<Image />` or `OptimizedImage`. | `npm run lint` clean |
| **P3-03** | Migration Script | `run-migration.js` references obsolete path `supabase/migration.sql`. | Automated migration runner helper fails. | `run-migration.js:L15` | Path updated to `supabase/migrations/20240101000000_init.sql`. | Script check |
| **P3-04** | Ad Campaign Pausing | `/api/ads/pause` is a 501 scaffold stub. | Advertisers cannot pause active campaigns. | `src/app/api/ads/pause/route.ts` | Campaign status toggles between `active` and `paused`. | API test |
