# Cluster Delta — Development Roadmap

**Last Updated:** June 2025 (Session 2)  
**Current State:** All critical/high bugs fixed across 2 audit sessions. Clean production build (48 routes, 0 TypeScript errors).  
**Full Audit Report:** See `COMPREHENSIVE_AUDIT_REPORT.md` for detailed fix descriptions.

---

## Phase 1: Stability & Bug Fixes ✅ COMPLETE (Session 1)

All CRITICAL and HIGH severity bugs from initial audit have been resolved:

- [x] Fix 30+ TypeScript compilation errors
- [x] Fix auth guards on Stories, Search, NotificationBell, FeedRightSidebar, Q&A
- [x] Fix Community page (Server → Client component for auth context)
- [x] Wire CommunityHeader Join/Leave button to mutations
- [x] Fix CommunityHeader `url(undefined)` banner
- [x] Fix ChatWindow — add `markAsRead` call
- [x] Fix NotificationBell — add `markAsRead` on click
- [x] Fix PostCard — wrap comments in `showComments` conditional
- [x] Fix Q&A view count infinite loop (useRef guard)
- [x] Implement `searchUsers` backend (was a stub)
- [x] Fix Profile page — try/catch for invalid IDs
- [x] Swap to working ProfileHeader with follow/message mutations

---

## Phase 1.5: Feature-Level Deep Audit ✅ COMPLETE (Session 2)

17 CRITICAL/HIGH issues found and fixed across all features:

### CRITICAL — Fixed
- [x] **POSTCARD-01:** Replace non-interactive PostCard with wrapper to interactive PostCard (affected ALL 7 pages)
- [x] **HASH-01:** Wire hashtag extraction in createPost (entire hashtag system was dead)
- [x] **MKT-01:** Fix marketplace price ÷100 display bug

### HIGH — Fixed
- [x] **PROF-02:** Auto-detect `isOwnProfile` in ProfileHeader
- [x] **STORY-03:** Fix story image URL (use `resolveStorageUrls` instead of fake CDN URL)
- [x] **STORY-04:** Add StoryRow to Feed component
- [x] **EVT-01:** Wire "Create Event" button to existing `CreateEventModal`
- [x] **MSG-01:** Wire conversation creation "+" button (new `NewConversationModal`)
- [x] **MKT-02:** Add seller enrichment to `getListings` query
- [x] **QA-01:** Wire "Ask Question" button (new `AskQuestionModal`)
- [x] **JOB-01:** Wire "Post Job" button (new `PostJobModal`)
- [x] **POST-01:** Add cascade cleanup on post delete (likes, hashtags, polls, notifications)
- [x] **ADS-01:** Fix `getAdAnalytics` return type to match `AdCard` props
- [x] **ONB-01:** Fix onboarding `useState` initialization race condition
- [x] **ONB-02:** Add university field to onboarding `ProfileStep`
- [x] **PROF-04:** Guard portfolio Add buttons to owner only
- [x] **NOTIF-02:** Add auth guard to notifications page

---

## Phase 2: Feature Completion (Current Priority)

### 2.1 — Notification System Polish
- [x] Fix notification routing (message → `/messages`, event → `/events/...`, follow → `/profile/...`)
- [x] Add missing notification icons for `message` and `event` types
- [x] Add auth guard to notifications page
- [ ] Add "mark all as read" button to NotificationBell dropdown
- [ ] Add push notification support (service worker is stubbed in `public/sw.js`)

### 2.2 — Content Creation Flows
- [x] Wire Marketplace "Post Listing" button to `CreateListingModal`
- [x] Add "Create Story" button to Stories page with `StoryComposer`
- [x] Wire "Create Event" button to `CreateEventModal`
- [x] Wire "Ask Question" button to new `AskQuestionModal`
- [x] Wire "Post Job" button to new `PostJobModal`
- [x] Wire conversation "+" button to new `NewConversationModal`
- [ ] Create `UploadResourceModal` component for Resources page
- [ ] Create `UploadPaperModal` component for Research Papers page
- [ ] Add image/media upload to Q&A answers
- [ ] Add rich text editor (Markdown) to post creation

### 2.3 — Profile Enhancements
- [x] Swap to working ProfileHeader with Follow/Message buttons
- [x] Make profile tabs link to actual pages (Portfolio)
- [x] Auto-detect isOwnProfile for button visibility
- [x] Guard portfolio Add buttons to owner only
- [ ] Add Activity tab content (recent likes, comments, shares)
- [ ] Add profile editing from profile page (not just settings)
- [ ] Add skill endorsements UI (backend `skill_endorsements.ts` exists)

### 2.4 — Community Features
- [x] Convert Community page to Client Component
- [x] Wire Join/Leave buttons
- [ ] Add community post creation (restrict to members only)
- [ ] Add moderation tools (remove posts, ban users)
- [ ] Add community invite system for private/secret communities
- [ ] Add community search/discovery page improvements

### 2.5 — Marketplace Enhancements
- [x] Fix price display (÷100 for cents→dollars)
- [x] Add seller enrichment to listings
- [ ] Add resource detail page
- [ ] Add marketplace transaction/purchase flow
- [ ] Add listing edit/delete for sellers

### 2.6 — Gamification & Leaderboard
- [ ] Add period filter support to leaderboard (needs reputation events table)
- [ ] Add badge display on profiles
- [ ] Add achievement notifications

### 2.7 — Settings Pages
- [ ] Implement Privacy settings (currently stub)
- [ ] Implement Billing settings (currently stub)

---

## Phase 3: Performance & UX

### 3.1 — Performance
- [ ] Add virtual scrolling to main feed (VirtualizedFeed component exists but may need optimization)
- [ ] Implement pagination for Comments (currently loads all)
- [ ] Add image lazy loading and blur placeholders
- [ ] Optimize Convex queries — add proper indexes for frequent queries
- [ ] Add React Query or SWR caching layer for server components

### 3.2 — UX Improvements
- [ ] Add toast notifications for successful actions (follow, join, post, etc.)
- [ ] Add confirmation dialogs for destructive actions (delete post, leave community)
- [ ] Add empty state illustrations (not just text)
- [ ] Add keyboard navigation support (accessibility)
- [ ] Add dark/light mode toggle in settings
- [ ] Improve mobile responsiveness across all pages

### 3.3 — Search
- [ ] Add full-text search index in Convex (replace in-memory filtering)
- [ ] Add search history / recent searches
- [ ] Add search suggestions/autocomplete
- [ ] Add filters (date range, type, community)

---

## Phase 4: Advanced Features

### 4.1 — Real-time Features
- [ ] Add typing indicators in Chat
- [ ] Add read receipts in Messages
- [ ] Add real-time presence indicators (online/away/offline)
- [ ] Add live comment counts on posts

### 4.2 — Analytics & Admin
- [ ] Build admin dashboard with user/content stats
- [ ] Add content moderation queue
- [ ] Add analytics for community growth
- [ ] Add user engagement metrics

### 4.3 — Social Features
- [ ] Add group messaging (backend exists in conversations.ts)
- [ ] Add user blocking/muting
- [ ] Add content reporting system
- [ ] Add hashtag following
- [ ] Add suggested posts algorithm improvements
- [ ] Add message attachments support

### 4.4 — Explore Pages
- [ ] Implement Find Partners page (currently stub)
- [ ] Implement Find Experts page (currently stub)

### 4.5 — Monetization
- [ ] Complete ads system (targeting, analytics, billing)
- [ ] Add premium subscriptions (backend `subscriptions.ts` exists)
- [ ] Add marketplace transaction flow (payment integration)

---

## Phase 5: Production Readiness

### 5.1 — Testing
- [ ] Add E2E tests with Playwright/Cypress for critical flows
- [ ] Add integration tests for auth flows
- [ ] Increase unit test coverage (property tests exist for several modules)
- [ ] Add visual regression tests

### 5.2 — Infrastructure
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure Sentry error monitoring (config files exist)
- [ ] Set up monitoring dashboards
- [ ] Add rate limiting for mutations
- [ ] Add input sanitization audit (sanitize.ts exists)

### 5.3 — Security
- [ ] Audit all mutations for proper authorization
- [ ] Add CSRF protection
- [ ] Review file upload security
- [ ] Add content security policy headers
- [ ] Rate limit authentication attempts

---

## Known Remaining Issues

| # | ID | Severity | Description | File(s) |
|---|----|----------|-------------|---------|
| 1 | RES-01 | MEDIUM | Resources "Upload" button has no modal | `resources/page.tsx` |
| 2 | PAP-01 | MEDIUM | Research Papers "Upload" button has no modal | `papers/page.tsx` |
| 3 | RES-02 | MEDIUM | No resource detail page | — |
| 4 | GAM-01 | MEDIUM | Leaderboard period filter needs reputation events | `gamification.ts` |
| 5 | SET-02 | MEDIUM | Privacy settings stub page | `settings/privacy/page.tsx` |
| 6 | SET-03 | MEDIUM | Billing settings stub page | `settings/billing/page.tsx` |
| 7 | MSG-02 | LOW | No group conversation support | `conversations.ts` |
| 8 | MSG-03 | LOW | Message attachments non-functional | `messages.ts` |
| 9 | EXP-03 | LOW | Find Partners page is stub | `explore/partners/page.tsx` |
| 10 | EXP-04 | LOW | Find Experts page is stub | `explore/experts/page.tsx` |
| 11 | ADM-01 | LOW | Admin dashboard all TODOs | `admin/page.tsx` |
| 12 | JOB-02 | LOW | No search/filter UI on jobs page | `jobs/page.tsx` |
| 13 | — | LOW | Profile Activity tab has no content | `profile/[id]/page.tsx` |
| 14 | — | LOW | No community post restriction for non-members | `c/[slug]/page.tsx` |
