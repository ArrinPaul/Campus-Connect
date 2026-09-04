# Campus Connect — Task Checklist

Companion to `docs/ROADMAP.md`. Check items off as they land. `[~]` = in
progress, `[x]` = done, `[ ]` = not started. Keep evidence (file paths) next
to each item so status can be verified later without re-auditing.

## §0 — Security (P0, blocks everything)

- [ ] **User action required, not yet done:** rotate the Supabase
      service-role key in the Supabase dashboard (Project Settings → API →
      reset `service_role` key) for project `urxgegqlyzvvvdyukjrg`.
- [ ] **User action required, not yet done:** rotate the Postgres database
      password (Project Settings → Database → reset password) for the same
      project.
- [x] Remove `seed.js` and `test_db.js` from the working tree — done via
      `git rm`. Note: this does **not** invalidate the leaked credentials by
      itself; rotation above is still required.
- [ ] Decide whether to scrub git history (`git filter-repo`/BFG) — only
      needed if this repo has ever been pushed to a remote, especially a
      public one. Ask the maintainer before doing this (rewrites history).
- [x] Add `seed.js`/`test_db.js`-style debug scripts to `.gitignore` going
      forward (`.gitignore` updated with explicit patterns).

## §1 — Fix the 30 stub routes

Each row: implement the DB function in `src/server/db/*.ts` (pattern:
`content.ts` `getPaperById`/`updatePaper`/`deletePaper`), then wire the route
(pattern: `src/app/api/research/{single,update,delete}/route.ts`).

**Search (breaks the nav-bar search entirely)**
- [x] `api/search/posts` — wired to `universalSearch`/new `searchPosts` in `src/server/db/misc.ts`
- [x] `api/search/users` — new `searchUsers`
- [x] `api/search/communities` — new `searchCommunities`

**Q&A (can't edit/delete/answer/search a question)**
- [x] `api/questions/update` — new `updateQuestion` in `content.ts`
- [x] `api/questions/delete` — new `deleteQuestion`
- [x] `api/questions/search` — reuse `getQuestions` filters
- [x] `api/questions/answers` — new `getQuestionAnswers`

**Study resources (can't open/edit/delete/download a resource)**
- [x] `api/resources/single` — new `getResourceById`
- [x] `api/resources/update` — new `updateResource`
- [x] `api/resources/delete` — new `deleteResource`
- [x] `api/resources/download` — new `getResourceDownloadUrl` (signed URL + view-count increment)

**Communities (moderation is broken)**
- [x] `api/communities/slug` — new `getCommunityBySlug`
- [x] `api/communities/members/approve` — new `approveMember`
- [x] `api/communities/members/remove` — new `removeMember`
- [x] `api/communities/invite/respond` — new `respondToInvite`

**Stories**
- [x] `api/stories/user` — new `getUserStories`
- [x] `api/stories/delete` — new `deleteStory`

**Misc**
- [x] `api/reposts/check` — wire existing `isReposted` (already implemented in `misc.ts`, just needed a route)
- [x] `api/reactions/counts` — new `getReactionCounts`
- [x] `api/polls/single` — new `getPollById`
- [x] `api/hashtags/search` — new `searchHashtags`
- [x] `api/marketplace/contact` — new `contactSeller` (creates/returns a DM conversation with the seller)
- [x] `api/events/my-events` — new `getUserEvents`
- [x] `api/comments/replies` — new `getCommentReplies`
- [x] `api/posts/activity` — new `getPostActivity`
- [ ] `api/ads/update` — needs an `ads` admin UI decision first, deferred (low traffic feature)
- [ ] `api/media/confirm` — needs to match the upload-confirm flow already in `src/lib/api.ts`; deferred, verify against `api/media/upload-url` contract before implementing
- [x] `api/presence/status` — confirmed intentionally left as a stub: presence is actually realtime-broadcast driven (`updatePresence` in `misc.ts` via a different path), REST route is unused by the frontend
- [x] `api/messages/typing` — confirmed intentionally left as a stub: typing indicator is realtime-only (`useTypingIndicator.ts`), REST route is genuinely unused

**Status as of this pass:** 24 of 30 stubs implemented and wired to real DB
logic (search ×3, questions ×4, resources ×4, communities ×4, stories ×2,
reposts/check, reactions/counts, polls/single, hashtags/search,
marketplace/contact, events/my-events, comments/replies, posts/activity).
2 confirmed as intentionally-inert (presence/status, messages/typing — real
functionality lives in realtime channels, not these REST routes). 2 deferred
pending product decisions (ads/update, media/confirm). Verified with a clean
`tsc --noEmit`, `next lint`, `npm run build`, and `jest --ci` (547/547
passing) after the changes.

## §2 — Data integrity

- [ ] Verify live `subscriptions` table schema against Stripe billing code —
      needs a direct Supabase query (**requires DB access this session
      didn't have** — do this first when you have dashboard/psql access).
- [ ] If schema drift confirmed, write a migration to reconcile
      `subscriptions` to one shape and update any code using the old shape.
- [ ] Add Zod schemas for write-path routes (posts, comments, messages,
      communities create/update) — start with the highest-traffic ones.
- [ ] Confirm no client-side code can call `notifications` insert directly
      (RLS policy is currently `WITH CHECK (true)`); tighten policy if any
      client path exists.
- [ ] Add `ALTER PUBLICATION supabase_realtime ADD TABLE ...` migration for
      any table currently relying on a dashboard-only Realtime config, so
      it's reproducible from source.

## §3 — Realtime & calls hardening

- [ ] Add a TURN server (Twilio Network Traversal Service, or self-hosted
      coturn) and wire its credentials into `useWebRTC.ts` alongside the
      existing STUN config.
- [ ] Add reconnect/backoff to realtime hooks (`useRealtimeNotifications`,
      `useRealtimeFeed`, `useRealtime`) — currently only log subscription
      status changes.

## §4 — UI pass ("feels like Facebook")

- [ ] Feed: confirm `@tanstack/react-virtual` is actually applied to the
      feed list, not just installed.
- [ ] Feed: skeleton loaders instead of spinners on first load.
- [ ] Composer: confirm Tiptap mention/hashtag autocomplete is wired into
      the real post composer (not just present as a dependency).
- [ ] Notifications: grouped notifications ("X and N others...").
- [ ] Messaging: read receipts + unread-per-conversation badge.
- [ ] Build one shared `<EmptyState>` / `<ErrorState>` / `<LoadingState>`
      component set and replace ad hoc per-page versions.
- [ ] Mobile pass: verify every dashboard page at 375px width.
- [ ] Dark mode: verify every page (not just shell/nav) respects theme.

## §5 — Test coverage for fixed stubs

- [ ] Playwright spec for search (posts/users/communities)
- [ ] Playwright spec for Q&A update/delete/answer flow
- [ ] Playwright spec for resource open/download/delete flow
- [ ] Playwright spec for community moderation (approve/remove/invite)
- [ ] Playwright spec for marketplace contact-seller flow

## §6 — Production readiness

- [ ] Replace `docs/PHASE_8_FINAL_REPORT.md`'s false "certified" claim with
      an accurate status (link to the audit or this roadmap).
- [ ] Reconcile `docs/PROJECT_AUDIT.md` QA tracker with actual state.
- [ ] Re-run full audit checklist (build/lint/tsc/jest/security) before any
      real launch.
- [x] Delete `patch.js`, `refactor_ui.js`, `refactor_ui.py`,
      `skills_output*.txt` — confirmed unused by any tooling/CI, removed.
