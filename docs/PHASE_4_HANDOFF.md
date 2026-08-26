# CAMPUS CONNECT — PHASE 4 HANDOFF SPECIFICATION

**Phase:** Phase 4 (Realtime Media, WebRTC E2E & Academic Pipelines)  
**Baseline Foundation:** Phase 3 Certified Complete (451 Passing Tests, 45 Suites, 0 P0 Blockers)  
**Focus:** Live WebRTC browser media verification, direct binary storage uploads in composer, and research paper peer review workflows.

---

## 1. Status of Completed Foundation & Integrations

- **Widgets**: `TrendingHashtags` and `SuggestedUsers` live in desktop feed sidebar.
- **Event & Job Lifecycle**: Complete CRUD and applicant management live with ownership authorization.
- **Q&A**: Question creation, answer submission, answer acceptance, question resolution, and atomic voting live.
- **Test Suite**: 451/451 tests passing (100%), 0 TypeScript errors, 204 production routes compiled.

---

## 2. Priority Phase 4 Implementation Targets

### Task 1: Direct Binary Storage Upload in `PostComposer`
- **File:** `src/components/posts/PostComposer.tsx`
- **Target:** Connect file picker to request signed upload URL from `/api/media/upload-url`, upload binary to Supabase `media` bucket, and attach public URL to post creation payload.

### Task 2: Research Paper Review & Voting Routes
- **Files:** `src/app/api/research/review/route.ts`, `src/app/api/research/vote/route.ts`
- **Target:** Implement peer review submissions and preprint voting in `src/server/db/content.ts`.

### Task 3: WebRTC Browser Media Verification
- **Files:** `src/hooks/useWebRTC.ts`, `src/components/calls/CallModal.tsx`
- **Target:** Verify two-client peer media streaming in browser test environments.

### Task 4: Marketplace Listing Mutation Handlers
- **Files:** `src/app/api/marketplace/update/route.ts`, `src/app/api/marketplace/delete/route.ts`
- **Target:** Allow students to update price/condition and delete active marketplace listings.

---

## 3. Explicitly Deferred

- **Gamification & Leaderboard**: Deferred to Phase 5.
- **Web Push Device Persistence & Service Worker Sync**: Deferred to Phase 6.
- **Playwright Automated E2E Browser Suite**: Deferred to Phase 6.
- **Stripe Premium Subscriptions**: Deferred to Phase 7.
