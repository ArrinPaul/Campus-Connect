# CAMPUS CONNECT — PHASE 3 HANDOFF SPECIFICATION

**Phase:** Phase 3 (Frontend ↔ Backend Feature Integration)  
**Baseline Foundation:** Phase 2 Certified Green (38 Tables, 122 RLS, 436 Passing Tests, 0 P0 Blockers)  
**Focus:** Connecting secondary mutations, wiring discovery widgets, and completing active CRUD paths.

---

## 1. Stable Foundation Available to Phase 3

- **Database Layer**: All 38 tables (`calls`, `questions` with `is_resolved`, `jobs` with `type`, `posts`, `messages`, `communities`, `events`, etc.) are fully provisioned with RLS and foreign keys.
- **Data Access**: 13 server DB modules in `src/server/db/` are type-safe, tested, and connected to Supabase.
- **Client API Client**: `@/lib/api.ts` provides typed React Query hooks with optimistic updates and cache invalidation.
- **Testing & CI**: 436 unit/component tests passing (100%), 0 TypeScript errors, 204 production routes compiled.

---

## 2. Priority Phase 3 Implementation Tasks

### Task 1: Wire `TrendingHashtags` Sidebar Widget
- **File:** `src/components/trending/TrendingHashtags.tsx`
- **Current State:** Renders static "Trending Topics Coming Soon" placeholder card.
- **Target Implementation:** Connect to `api.hashtags.getTrending`, render top 5 trending tags with post counts and click-to-filter action.
- **API Route:** `GET /api/hashtags/trending` (Active in `src/app/api/hashtags/trending/route.ts`).
- **Acceptance Criteria:** Desktop feed sidebar displays live trending hashtags with skeleton loader.
- **Test Required:** `TrendingHashtags.test.tsx`.

### Task 2: Wire `SuggestedUsers` Sidebar Widget
- **File:** `src/components/discover/SuggestedUsers.tsx`
- **Current State:** Renders static "Suggested Connections Coming Soon" placeholder card.
- **Target Implementation:** Connect to `api.follows.getSuggestedUsers` (or `api.graph.getRecommendations`).
- **API Route:** `GET /api/follows/suggestions` / `GET /api/graph/recommendations`.
- **Acceptance Criteria:** Sidebar displays up to 5 suggested students with role and 1-click Follow button.
- **Test Required:** `SuggestedUsers.test.tsx`.

### Task 3: Implement Event Management Routes
- **Files:** `src/app/api/events/delete/route.ts`, `src/app/api/events/update/route.ts`
- **Current State:** 501 scaffold stubs.
- **Target Implementation:** Implement host ownership verification, update/delete queries in `src/server/db/events-jobs.ts`.
- **Acceptance Criteria:** Event hosts can edit event details and cancel/delete events.
- **Test Required:** `events.test.ts`.

### Task 4: Implement Job Management Routes
- **Files:** `src/app/api/jobs/delete/route.ts`, `src/app/api/jobs/job-applications/route.ts`
- **Current State:** 501 scaffold stubs.
- **Target Implementation:** Implement job owner verification, fetch submitted applications for job poster.
- **Acceptance Criteria:** Job posters can review applicant list and delete closed job postings.
- **Test Required:** `jobs.test.ts`.

### Task 5: Implement Q&A Question Voting
- **File:** `src/app/api/questions/vote/route.ts`
- **Current State:** 501 scaffold stub.
- **Target Implementation:** Implement atomic vote toggle incrementing `questions.vote_count`.
- **Acceptance Criteria:** Students can upvote and downvote questions.
- **Test Required:** `questions.test.ts`.

### Task 6: PostComposer Direct Storage Upload
- **File:** `src/components/posts/PostComposer.tsx`
- **Current State:** Uploads image/video metadata but contains placeholder comment for direct binary upload.
- **Target Implementation:** Request signed upload URL from `/api/media/upload-url`, upload binary directly to Supabase `media` bucket, and attach public URL to post creation payload.
- **Acceptance Criteria:** Images selected in file picker appear in feed post card immediately after creation.
- **Test Required:** `PostComposer.test.tsx`.

---

## 3. Explicitly Deferred to Future Phases

- **Gamification & Leaderboard**: Deferred to Phase 5.
- **Web Push Device Persistence**: Deferred to Phase 6.
- **Playwright Automated E2E Browser Suite**: Deferred to Phase 6.
- **Stripe Subscriptions & Checkout**: Deferred to Phase 7.
- **Ad Campaign Pausing & Budgeting**: Deferred to Phase 7.
