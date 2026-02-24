# Cluster Delta — Comprehensive Feature Audit Report (Sessions 2 & 3)

**Date:** June 2025  
**Build Status:** CLEAN (0 TypeScript errors, 48 routes compiled)

---

## Executive Summary

Conducted a full feature-by-feature audit across all 30+ features covering frontend, backend, schema, and integration. Identified **102+ issues** across all features. **Fixed 24 CRITICAL and HIGH priority issues** across sessions 2 and 3. The remaining items are documented in the roadmap for future sprints.

---

## CRITICAL Issues — FIXED

### 1. POSTCARD-01: Non-Interactive PostCard Used Everywhere
- **Impact:** All post buttons (Like, Comment, Repost, Bookmark, Delete) were purely visual — ZERO mutations called
- **Root Cause:** Two parallel PostCard components existed. The non-interactive one at `src/app/(components)/feed/PostCard.tsx` was imported by all 7 pages. The fully interactive one at `src/components/posts/PostCard.tsx` (with reactions, comments, bookmarks, reposts, media, polls) was never imported by any route.
- **Fix:** Replaced `src/app/(components)/feed/PostCard.tsx` with a thin wrapper that delegates to the interactive PostCard, adapting the `FeedItem` prop shape. All 7 pages now automatically use the interactive version.
- **Files:** `src/app/(components)/feed/PostCard.tsx`

### 2. HASH-01: Hashtag System Completely Dead
- **Impact:** Hashtags typed in posts were never extracted or linked — the entire hashtag feature was non-functional
- **Root Cause:** `createPost` in `convex/posts.ts` never called `linkHashtagsToPost` from `convex/hashtags.ts`
- **Fix:** Added import and call to `linkHashtagsToPost(ctx, postId, sanitizedContent)` after post insertion
- **Files:** `convex/posts.ts`

### 3. MKT-01: Marketplace Price ×100 Display Bug
- **Impact:** A $25.00 listing was displayed as "$2500.00" — CreateListingModal multiplied by 100 (dollars→cents) but ListingCard displayed raw
- **Fix:** Added `/ 100` in ListingCard price display: `(listing.price / 100).toFixed(2)`
- **Files:** `src/app/(components)/marketplace/ListingCard.tsx`

---

## HIGH Issues — FIXED

### 4. PROF-02: isOwnProfile Hardcoded False
- **Impact:** Profile page always showed Follow/Message buttons even on own profile
- **Fix:** Made `ProfileHeader` auto-detect ownership by querying `getCurrentUser` and comparing IDs
- **Files:** `src/components/profile/ProfileHeader.tsx`

### 5. STORY-03: Story Image Placeholder CDN URL
- **Impact:** Uploaded story images used a fabricated URL that doesn't resolve
- **Fix:** Replaced with actual `resolveStorageUrls` mutation call
- **Files:** `src/components/stories/StoryComposer.tsx`

### 6. EVT-01: Create Event Button Not Wired
- **Impact:** "Create Event" button had no onClick handler
- **Fix:** Added state management and rendered existing `CreateEventModal`
- **Files:** `src/app/(dashboard)/events/page.tsx`

### 7. MSG-01: Conversation Creation "+" Button Dead
- **Impact:** PlusCircle button in conversation list had no onClick handler
- **Fix:** Created `NewConversationModal` with user search and `getOrCreateConversation` integration
- **Files:** `src/app/(components)/messages/ConversationList.tsx`, `src/app/(components)/messages/NewConversationModal.tsx`

### 8. STORY-04: StoryRow Not in Feed
- **Impact:** Story circles never appeared at top of feed
- **Fix:** Added `<StoryRow />` to Feed component
- **Files:** `src/app/(components)/feed/Feed.tsx`

### 9. MKT-02: getListings Missing Seller Enrichment
- **Impact:** Listing cards couldn't display seller name/avatar
- **Fix:** Added seller data enrichment via db join
- **Files:** `convex/marketplace.ts`

### 10. QA-01: "Ask a Question" Button Not Wired
- **Impact:** Button had no onClick handler, no modal existed
- **Fix:** Created `AskQuestionModal` wired to `api.questions.askQuestion`
- **Files:** `src/components/q-and-a/AskQuestionModal.tsx`, `src/app/(dashboard)/q-and-a/page.tsx`

### 11. JOB-01: "Post a Job" Button Not Wired
- **Impact:** Button had no onClick handler, no modal existed
- **Fix:** Created `PostJobModal` wired to `api.jobs.postJob`
- **Files:** `src/components/jobs/PostJobModal.tsx`, `src/app/(dashboard)/jobs/page.tsx`

### 12. POST-01: Delete Post Missing Cascade Cleanup
- **Impact:** Deleting a post left orphaned likes, postHashtags, polls, pollVotes, and notifications
- **Fix:** Added 4 new cleanup mutations: `cleanupPostLikes`, `cleanupPostHashtags`, `cleanupPostPolls`, `cleanupPostNotifications`
- **Files:** `convex/posts.ts`

### 13. ADS-01: AdCard Type Mismatch
- **Impact:** `getAdAnalytics` returned a minimal projection but AdCard expected full doc
- **Fix:** Changed `getAdAnalytics` to return full ad doc + `ctr`
- **Files:** `convex/ads.ts`, `src/app/(dashboard)/ads/dashboard/page.tsx`

### 14. ONB-01: Onboarding useState Initialization Bug
- **Impact:** Form always started empty because `currentUser` was undefined on first render
- **Fix:** Added `useEffect` to update formData when `currentUser` loads
- **Files:** `src/app/(onboarding)/onboarding/page.tsx`

### 15. ONB-02: Missing University Field in ProfileStep
- **Impact:** Users couldn't set university during onboarding
- **Fix:** Added university input field to ProfileStep
- **Files:** `src/app/(components)/onboarding/ProfileStep.tsx`

### 16. PROF-04: Portfolio Add Buttons Visible to Everyone
- **Impact:** "Add Project" and "Add Event" buttons visible to visitors
- **Fix:** Added owner check, conditionally render buttons
- **Files:** `src/app/(dashboard)/profile/[id]/portfolio/page.tsx`

### 17. NOTIF-02: Notifications Page Missing Auth Guard
- **Impact:** Page rendered for unauthenticated users
- **Fix:** Added `useConvexAuth` guard with loading/auth states
- **Files:** `src/app/(dashboard)/notifications/page.tsx`

---

## Remaining Issues (Roadmap)

| ID | Severity | Feature | Issue | Status |
|----|----------|---------|-------|--------|
| GAM-01 | MEDIUM | Leaderboard | Period filter ignored — needs reputation events table | Deferred |
| SET-02 | MEDIUM | Settings | Privacy settings stub page | Deferred |
| SET-03 | MEDIUM | Settings | Billing settings stub page | Deferred |
| EXP-03 | LOW | Explore | Find Partners page is stub | Deferred |
| EXP-04 | LOW | Explore | Find Experts page is stub | Deferred |
| ADM-01 | LOW | Admin | Dashboard all TODOs | Deferred |
| RES-01 | MEDIUM | Resources | Upload resource flow missing | Deferred |
| PAP-01 | MEDIUM | Research | Upload paper flow missing | Deferred |
| RES-02 | MEDIUM | Resources | No resource detail page | Deferred |
| MSG-02 | LOW | Messages | No group conversation support | Deferred |
| MSG-03 | LOW | Messages | Message attachments non-functional | Deferred |
| JOB-02 | LOW | Jobs | No search/filter UI on jobs page | Deferred |

---

## Session 3 — Verification & Additional Fixes

### 18. PROF-05: isOwnProfile Auto-Detect Defeated by Explicit `false`
- **Severity:** CRITICAL
- **Impact:** Profile page passed `isOwnProfile={false}` explicitly, which `??` does not override (only null/undefined). Users could never see own-profile controls.
- **Fix:** Removed explicit `isOwnProfile={false}` prop — auto-detection now works correctly.
- **Files:** `src/app/(dashboard)/profile/[id]/page.tsx`

### 19. MSG-04: NewConversationModal Wrong Query Parameter
- **Severity:** HIGH
- **Impact:** After creating a conversation, modal navigated to `/messages?conversation=X` but the messages page reads `searchParams.get('c')`. New conversation was never selected after redirect.
- **Fix:** Changed to `router.push(\`/messages?c=\${conversationId}\`)`
- **Files:** `src/app/(components)/messages/NewConversationModal.tsx`

### 20. ADS-02: Ads Dashboard Missing Auth Guard
- **Severity:** HIGH
- **Impact:** `getAdAnalytics` throws `Unauthorized` if no identity. Page crashed for unauthenticated users.
- **Fix:** Added `useConvexAuth()` + skip pattern
- **Files:** `src/app/(dashboard)/ads/dashboard/page.tsx`

### 21. EXP-05: ExplorePostGrid Runaway Pagination
- **Severity:** HIGH
- **Impact:** `setCursor(nextCursor)` was called outside both conditional branches, triggering a cascade of fetches. All pages were fetched on initial load without displaying them.
- **Fix:** Moved `setCursor` and `setHasMore` inside the conditional branches that process data.
- **Files:** `src/app/(components)/explore/ExplorePostGrid.tsx`

### 22. POST-06: Delete Post Missing userFeed Cleanup
- **Severity:** MEDIUM
- **Impact:** Orphaned `userFeed` entries accumulated after post deletion. Handled gracefully at read time but never cleaned up.
- **Fix:** Added `cleanupPostFeedEntries` internal mutation and added it to the delete cascade.
- **Files:** `convex/posts.ts`

### 23. PROF-06: Profile/Me No Error State for Unauthenticated
- **Severity:** MEDIUM
- **Impact:** `/profile/me` showed a permanent spinner if auth failed (currentUser was null).
- **Fix:** Added `useConvexAuth` skip pattern and sign-in redirect for unauthenticated users.
- **Files:** `src/app/(dashboard)/profile/me/page.tsx`

### 24. STORY-05: StoryRow Missing Skip Pattern
- **Severity:** LOW
- **Impact:** Brief flash of empty story row during auth loading.
- **Fix:** Added `useConvexAuth` + skip pattern for both `getStories` and `getCurrentUser` queries.
- **Files:** `src/components/stories/StoryRow.tsx`

---

## Files Modified This Session (Session 3)

| File | Change |
|------|--------|
| `src/app/(dashboard)/profile/[id]/page.tsx` | Removed explicit `isOwnProfile={false}` |
| `src/app/(components)/messages/NewConversationModal.tsx` | Fixed query param `conversation` → `c` |
| `src/app/(dashboard)/ads/dashboard/page.tsx` | Added auth guard with skip pattern |
| `src/app/(components)/explore/ExplorePostGrid.tsx` | Fixed runaway pagination |
| `convex/posts.ts` | Added `cleanupPostFeedEntries` mutation |
| `src/app/(dashboard)/profile/me/page.tsx` | Added auth guard + sign-in redirect |
| `src/components/stories/StoryRow.tsx` | Added skip pattern |

---

## Files Modified (Session 2)

| File | Change |
|------|--------|
| `src/app/(components)/feed/PostCard.tsx` | Replaced with interactive PostCard wrapper |
| `src/app/(components)/feed/Feed.tsx` | Added StoryRow |
| `src/app/(components)/messages/ConversationList.tsx` | Wired "+" button to modal |
| `src/app/(components)/messages/NewConversationModal.tsx` | **NEW** |
| `src/app/(components)/marketplace/ListingCard.tsx` | Fixed price ÷100 |
| `src/app/(components)/onboarding/ProfileStep.tsx` | Added university field |
| `src/app/(dashboard)/events/page.tsx` | Wired Create Event button |
| `src/app/(dashboard)/jobs/page.tsx` | Wired Post Job button |
| `src/app/(dashboard)/notifications/page.tsx` | Added auth guard |
| `src/app/(dashboard)/q-and-a/page.tsx` | Wired Ask Question button |
| `src/app/(dashboard)/ads/dashboard/page.tsx` | Fixed ad key reference |
| `src/app/(dashboard)/profile/[id]/portfolio/page.tsx` | Guarded Add buttons |
| `src/app/(onboarding)/onboarding/page.tsx` | Fixed useState init |
| `src/components/profile/ProfileHeader.tsx` | Auto-detect isOwnProfile |
| `src/components/stories/StoryComposer.tsx` | Fixed media URL resolution |
| `src/components/q-and-a/AskQuestionModal.tsx` | **NEW** |
| `src/components/jobs/PostJobModal.tsx` | **NEW** |
| `convex/posts.ts` | Hashtag linking + cascade cleanup |
| `convex/marketplace.ts` | Seller enrichment |
| `convex/ads.ts` | Full doc return |
