# CAMPUS CONNECT — PHASE 5 HANDOFF SPECIFICATION

**Phase:** Phase 5 (Gamification, Reputation, Leaderboard & Skill Endorsements)  
**Baseline Foundation:** Phase 4 Certified Complete (48 Suites, 475 Passing Tests, 0 P0 Blockers)  
**Focus:** Student reputation engine, leaderboard ranking pages, achievement badges, and peer skill endorsement UX.

---

## 1. Status of Completed Foundation

- **Media & Feed**: Direct binary upload to Supabase Storage `media` bucket active and verified in `PostComposer.tsx`.
- **Academic Systems**: Q&A voting, answer acceptance, research paper uploads, preprint peer reviews, and preprint voting active.
- **Realtime Calling**: WebRTC signaling, `getUserMedia` audio/video tracks, SDP/ICE negotiation, and cleanup verified in browser environment.
- **Marketplace**: Complete CRUD, seller authorization, and sold status management active.
- **Test Suite**: 475/475 tests passing (100%), 0 TypeScript errors, 204 production routes compiled.

---

## 2. Priority Phase 5 Implementation Targets

### Task 1: Gamification Leaderboard UI & API
- **Files:** `src/app/(dashboard)/leaderboard/page.tsx` (new), `src/server/db/users.ts`
- **Target:** Connect to table `user_reputation`, support sorting by weekly/monthly/all-time reputation points and university filters.

### Task 2: Reputation Points Trigger Engine
- **Files:** `src/server/db/users.ts`, `src/server/db/content.ts`
- **Target:** Award reputation points for accepted answers (+15), upvoted questions (+5), upvoted preprints (+10), and helpful peer reviews (+10).

### Task 3: Skill Endorsement Interactive UI
- **Files:** `src/components/profile/SkillsManager.tsx`, `src/app/api/skills/endorse/route.ts`
- **Target:** Allow students/faculty to click to endorse specific skills on a user profile with live incrementing endorsement counts.

### Task 4: Achievement Badges System
- **Files:** `src/components/profile/ProfileHeader.tsx`, `src/types/index.ts`
- **Target:** Render earned achievement badges (e.g. "Top Researcher", "Helpful Peer", "Campus Leader") on user profiles.

---

## 3. Explicitly Deferred to Future Phases

- **Phase 6**: Web Push Background Notifications Persistence & Playwright Automated E2E Browser Suite.
- **Phase 7**: Stripe Premium Student Subscriptions & Distributed Redis Upstash Rate Limiting.
