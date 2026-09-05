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

## §1b — Engine verification (2026-09-05 follow-up)

Checked whether the feed and recommendation systems are real or fake, since
they're easy to fake with hardcoded data and easy to miss in a route-by-route
audit.

- [x] **Feed engine** (`getFeedPosts` in `posts.ts`) — confirmed real: pulls
      a pool of recent posts, scores by affinity (follow/self) × engagement
      (log-scaled likes/comments/shares) × time-decay gravity, then ranks
      and paginates. Not a stub, not "most recent only."
- [x] **Friend suggestions** (`api/graph/suggestions`) — confirmed real:
      scores by mutual connections, shared university, shared skills, shared
      communities, popularity fallback. Not hardcoded.
- [x] **Partner/study-buddy matching** (`matching-engine.ts`) — confirmed
      real: cosine + Jaccard similarity across skills/university/department/
      bio. Not hardcoded.
- [x] **Semantic research search degraded silently without
      `OPENAI_API_KEY`** — `.env.local` still doesn't have a real key set
      (this session can't set production secrets either), so made the
      degraded mode visible instead of fixing the missing key itself:
      `getEmbeddingProvider()` now logs a `warn` the first time it falls
      back to `MockEmbeddingProvider` (once per process, not per request —
      semantic search can run on every keystroke). `GET /api/research/search`
      also sets an `X-Semantic-Search-Degraded: true` response header when
      running degraded and the query is non-empty, without changing the
      response body shape (stays the established bare-array contract, so no
      frontend changes needed). Added
      `src/server/recommendations/embedding-provider.test.ts` (4 tests:
      warns once when unset, doesn't warn twice, warns on a `mock_`
      placeholder key, doesn't warn and returns the real provider with a
      real key).
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (605/605 passing).
- [ ] **Confirm production env vars**, not just local `.env.local`: Stripe,
      VAPID, Upstash, OpenAI, Sentry, PostHog are all unset locally — billing,
      push notifications, rate limiting (fails open, not closed), semantic
      search, and monitoring are effectively non-functional or degraded
      without them. Unknown whether Vercel's production env has these set;
      this environment can't check that.

## §2 — Data integrity

- [ ] Verify live `subscriptions` table schema against Stripe billing code —
      needs a direct Supabase query (**requires DB access this session
      didn't have** — do this first when you have dashboard/psql access).
- [ ] If schema drift confirmed, write a migration to reconcile
      `subscriptions` to one shape and update any code using the old shape.
- [x] Add Zod schemas for the highest-traffic write-path routes: `api/posts`
      (create), `api/comments` (create), `api/communities` (create — had
      **zero** validation before), `api/questions` (create — previously
      spread the raw request body into the DB insert). Added a shared
      `parseBody()` helper in `src/lib/validation.ts`. `api/messages` (send)
      already had adequate hand-rolled validation, left as-is.
      **Found in the process:** `api/questions` POST was forwarding a
      `course` field from the frontend into an insert against a `questions`
      table that has no `course` column — would have errored in production
      the first time a real client sent one. Fixed at the time by dropping
      the field at the API boundary; properly resolved later in the session
      by adding the column via migration (see below) and forwarding it for
      real.
- [x] **Extended Zod validation to the remaining write routes — and found
      that 3 of the 5 were completely broken against the live schema, not
      just unvalidated.** Same frontend/schema drift pattern as the
      `questions.course` bug found earlier (a form was built against field
      names / value shapes the DB doesn't have), but worse: these would
      currently fail outright on submit, not just silently drop a field.
      - `api/research` (paper upload) — frontend sends `pdfUrl`, `doi`,
        `lookingForCollaborators`; table only has `file_url` (no `doi`/
        `lookingForCollaborators` column at all). Fixed: map `pdfUrl` →
        `file_url`, drop the other two.
      - `api/events` (create) — frontend sends camelCase
        `eventType`/`startDate`/`endDate` (epoch numbers) plus
        `virtualLink`/`maxAttendees`; table columns are snake_case
        `event_type`/`start_time`/`end_time` and have no virtual-link or
        attendee-cap column at all. **This route would 400 on every single
        submission** (Postgrest rejects unknown columns) — event creation
        was fully broken, not just unvalidated. Fixed: map fields, convert
        timestamps to ISO strings, and (once the migration below landed)
        forward `virtualLink`/`maxAttendees` to real columns.
      - `api/jobs` (create) — frontend's `type` field is `'job' |
        'internship'`, but the `jobs.type` CHECK constraint only allows
        `full_time`/`part_time`/`internship`/`contract` — **`'job'` would
        violate the constraint and fail the insert on every full-time
        posting**, the most common case. Also `skillsRequired` needed
        mapping to the `skills` column. Fixed: map `'job'` → `'full_time'`,
        `skillsRequired` → `skills`, and (once the migration below landed)
        forward `remote`/`duration` to real columns.
      - `api/marketplace/update` — frontend sends a `condition` field.
        Fixed: validated, and (once the migration below landed) forwarded
        to a real column.
      - `api/resources` (upload) — this one only needed validation added
        (no drift found), now has a proper schema.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (567/567, including the existing
      `marketplace-mutations.test.ts` still passing).
- [ ] **This session found the same "frontend built against different
      field names/shapes than the live schema" bug four separate times**
      (questions.course, research paper upload, event creation, job
      posting) — strong signal this app was scaffolded against a different
      backend convention (the codebase's pervasive `Id<'...'>`/`_id`-style
      types read like a Convex holdover) and several forms were never
      updated when it moved to Supabase's snake_case schema. Worth a
      dedicated sweep of every remaining create/update form against its
      actual table columns rather than assuming the ones not yet touched
      are fine — this pattern has had a 100% hit rate everywhere checked
      so far.
- [x] **Resolved all 5 pending schema-drift decisions with one additive
      migration** rather than leaving them open or deleting working form
      fields: `supabase/migrations/20240105000000_frontend_schema_drift_fixes.sql`
      adds `questions.course`, `events.virtual_link` + `events.max_attendees`,
      `jobs.remote` + `jobs.duration`, and
      `marketplace_listings.condition` (CHECK-constrained to the same 5
      values `CreateListingModal.tsx` uses) + `marketplace_listings.university`.
      All columns are nullable with no default required — safe against
      existing rows. Updated all 5 routes (`api/questions`, `api/events`,
      `api/jobs`, `api/marketplace`, `api/marketplace/update`) to actually
      forward these fields instead of dropping them.
      **Important caveat: this migration exists in the repo but has NOT
      been applied to any live database** — this session has no Supabase
      access to run it. Someone needs to run
      `supabase db push` (or apply it via the SQL editor in the Supabase
      dashboard) against the real project before these fields will
      actually persist; until then the routes will fail on these new
      fields exactly the way the old ones did before this fix (unknown
      column), for `course`/`virtual_link`/`max_attendees`/`remote`/
      `duration` specifically — `condition`/`university` will just be
      silently dropped again by Zod, same as before, since those aren't
      new failure points.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (567/567) — none of that can verify the migration itself
      runs cleanly against a real database, only that the TypeScript/route
      side is consistent with it.
- [x] Confirmed no client-side code calls `notifications` insert directly —
      grepped every `.from("notifications").insert` in `src/`, found exactly
      one, `createNotification` (notifications.ts), which uses
      `createAdminClient()` (service-role, bypasses RLS entirely). RLS on
      this table was never actually gating the app's own writes, only
      failing to gate a hypothetical malicious direct client. Tightened via
      `supabase/migrations/20240106000000_tighten_notifications_insert_policy.sql`
      (`WITH CHECK (true)` → `WITH CHECK (false)`) — zero effect on real
      traffic, closes the gap for anyone calling the client directly with
      their own session.
- [x] Added `supabase/migrations/20240107000000_realtime_publication.sql` —
      idempotent `ALTER PUBLICATION supabase_realtime ADD TABLE` for the
      three tables client code actually subscribes to via `postgres_changes`
      (found by grepping every `table:` in a `postgres_changes` subscription):
      `notifications`, `posts`, `messages`. If Realtime has been working for
      these, it's because someone enabled it by hand in the dashboard,
      which wasn't reproducible from source — now it is.
      **Same caveat as the other new migration this session: neither of
      these two SQL files has been applied to any live database** — this
      session has no Supabase access to run them. Both are additive/
      idempotent and safe to apply whenever someone with access runs
      `supabase db push` (or the dashboard SQL editor).

## §3 — Realtime & calls hardening

- [ ] Add a TURN server (Twilio Network Traversal Service, or self-hosted
      coturn) and wire its credentials into `useWebRTC.ts` alongside the
      existing STUN config.
- [x] Added reconnect/backoff to all three realtime hooks
      (`useRealtimeNotifications`, `useRealtimeFeed`, `useRealtime` /
      `useRealtimeMessages`) — they previously only logged
      `CHANNEL_ERROR`/`TIMED_OUT` without retrying. Added
      `src/lib/realtime-backoff.ts` (`withReconnect`), a shared helper that
      wraps the `.subscribe()` status callback: exponential backoff (1s →
      2s → 4s ... capped at 30s, max 6 attempts), resets the attempt count
      on a successful `SUBSCRIBED`, and resubscribes the same channel
      instance after a delay rather than tearing down and re-registering
      every `.on()` handler (the pattern Supabase's realtime-js docs
      recommend for this). Each hook's cleanup calls the helper's `cancel()`
      to stop any pending retry timer on unmount, avoiding a leak.
      Added `src/lib/realtime-backoff.test.ts` (6 tests, using fake timers)
      covering the backoff math, the reset-after-success behavior, and
      cancellation — this is exactly the kind of timing logic that's easy
      to get subtly wrong and hard to catch without a fake-timer test.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (581/581 passing). Not visually/live verified against an
      actual dropped connection — same Chrome-permission and no-live-app
      constraints as the rest of this session's frontend work; the fix is
      reasoned from Supabase's documented reconnect pattern and covered by
      unit tests of the backoff logic itself, not observed against a real
      network drop.

## §4 — UI pass ("feels like Facebook")

- [x] Feed: confirmed `@tanstack/react-virtual` is genuinely applied —
      `VirtualizedFeed.tsx` is used by `FeedContainer.tsx` (which has its
      own test file). Not dead code.
- [x] Feed: skeleton loaders instead of spinners on first load — confirmed
      **already present** (`FeedContainer.tsx` used `LoadingSkeleton`, not a
      spinner), but found and fixed two real bugs while verifying it:
      1. `FeedContainer`'s inline skeleton and `SuggestedUsers`' inline
         skeleton both used `bg-card` for the pulsing bars *inside* a
         `bg-card` panel — same color on same color, so the "loading"
         state was invisible gray-on-gray. Fixed by pointing `FeedContainer`
         at the existing shared `PostSkeleton` (`loading-skeleton.tsx`) and
         fixing `SuggestedUsers`' bars to `bg-muted`.
      2. The shared skeleton library (`loading-skeleton.tsx`, 40+ call
         sites: `PostSkeleton`, `UserCardSkeleton`, `MessageListSkeleton`,
         `CommunityCardSkeleton`, `EventCardSkeleton`,
         `ListingDetailSkeleton`, `LeaderboardSkeleton`, etc.) all use an
         `animate-shimmer` class that was **never defined** anywhere —
         Tailwind silently drops unknown utility classes, so none of these
         skeletons were actually animating (a few also lack a `animate-pulse`
         fallback on their parent, so those were fully static). Fixed by
         adding a real `shimmer` keyframe + `animation` to
         `tailwind.config.ts` — no component code needed to change, the
         existing class names now do what they always claimed to do.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (557/557).
- [x] Composer: confirmed Tiptap mention autocomplete is real and wired —
      `PostComposer.tsx` uses `MentionAutocomplete` with live `@`-trigger
      state, not just an unused import.
- [x] **Swept every `animate-pulse` call site (27 files with a `bg-card` +
      `animate-pulse` combination) for the same bg-card-on-bg-card contrast
      bug found earlier in `FeedContainer`/`SuggestedUsers`.** Most are a
      single whole-card skeleton block (`bg-card` pulsing against a
      different-colored page background) — correct, not a bug. Found and
      fixed 4 more real instances of the actual bug (a `bg-card` *bar*
      rendered inside a `bg-card` *panel*, so the bar was invisible against
      its own immediate parent): `UserActivityFeed.tsx`, `PollCard.tsx`,
      `UserPostList.tsx`, `CreatePost.tsx` — all fixed by switching the
      inner bars to `bg-muted`, matching the fix pattern and the working
      examples already in `BookmarkedPostList.tsx`/`find-partners`/
      `find-experts`/`feed/loading.tsx` (which all correctly used
      `bg-muted`/`bg-canvas` for inner bars from the start).
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (601/601 passing). **Not visually verified in a
      browser** — same standing Chrome-permission blocker.
- [x] **Media lightbox** — checked `MediaGallery.tsx` / `ImageLightbox`:
      already fully built to a high standard (grid layout, double-tap-to-like
      heart burst, zoom, keyboard nav, dot indicators, file/video/image
      handling) — no new component needed. Found and fixed one real bug:
      the dialog's `onKeyDown` (arrows/Escape) never worked on open because
      nothing moved focus into it — the thumbnail button that triggered it
      stayed focused (now hidden behind the backdrop), so keyboard nav
      required an extra throwaway click first. Fixed with a mount-time
      `.focus()` on the dialog ref and switched its `tabIndex` from `0` to
      `-1` (correct pattern for a programmatically-focused dialog — reachable
      via script, not inserted into normal Tab order).
- [x] **Composer drag-drop attach** — `PostComposer.tsx` had click-to-browse
      file inputs (image/video/file, all wired to `handleFileSelect`) but no
      drop zone at all. Added `onDragOver`/`onDragLeave`/`onDrop` on the
      composer form, routing dropped files through the existing
      `handleFileSelect` (same validation/compression path as the file
      picker — no new validation logic needed), with a "Drop to attach"
      overlay while dragging. Images win if a mix of file types is dropped;
      falls back to video, then generic file.
- [x] **Notifications were never actually created — the single biggest
      finding of the UI pass.** `createNotification()`
      (`src/server/db/notifications.ts`) was fully and well built: inserts
      the row, broadcasts on the `notifications:${userId}` realtime channel
      the bell already subscribes to, and dispatches a Web Push notification
      with per-type deep-link routing. It was called **nowhere in the
      codebase.** The entire notification UI — bell, live badge, dropdown,
      mark-as-read, realtime hook — was fully working against a table that
      could never have a row in it, because nothing ever inserted one.
      Wired it into the four core trigger points:
        - `addReaction` (reactions.ts) — notifies the post author on a like,
          skips self-likes.
        - `createComment` (comments.ts) — notifies the post author on a
          comment, and separately the parent comment's author on a reply
          (deduped so the same person isn't notified twice).
        - `followUser` (follows.ts) — notifies the followed user.
        - `createPost` (posts.ts) — parses `@username` mentions out of post
          content (cap 20 per post), resolves to user IDs, notifies each,
          skipping the author.
      Added `src/tests/notification-triggers.test.ts` to lock this in — it
      exists specifically so this can't silently regress back to "fully
      built, never called" again. 560/560 tests passing after this change.
- [x] Notifications: grouped notifications ("X and N others..."). Added
      `src/lib/notifications/group.ts` (`groupNotifications`) — collapses
      repeat notifications that share `type` + `reference_type` +
      `reference_id` into one row with a composed message ("Alice and 3
      others liked your post"), keeping the most recent actor/timestamp and
      marking the group read only once every notification in it is read.
      Scoped deliberately narrow: only `like` and `event_rsvp` are
      groupable — types like `answer`/`message`/`comment` carry distinct
      per-notification content and are never collapsed even if they share a
      reference_id, so nothing meaningful gets hidden.
      Wired into both `NotificationBell`'s dropdown and the
      `/notifications` page; clicking a grouped row marks every id in the
      group as read (`NotificationItem` and the bell's click handler now
      accept an optional `ids: string[]` and mark all of them, falling back
      to the single id when ungrouped).
      Added `src/lib/notifications/group.test.ts` (6 tests: collapses same-
      post likes, keeps different posts separate, never groups non-
      groupable types, read-only-when-all-read, single notification passes
      through unchanged, empty input).
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (601/601 passing). **Not visually verified in a
      browser** — same standing Chrome-permission blocker as the rest of
      this session's frontend work.
- [x] **While starting the grouping work above, found the entire
      notification display layer was broken and had never been exercised —
      arguably the second-biggest finding of this session, same root cause
      as the original "notifications never fire" bug: it was built before
      the table could ever have a row in it, so nothing ever caught it.**
      `NotificationBell.tsx`, `NotificationItem.tsx`, and
      `(dashboard)/notifications/page.tsx` all read camelCase fields
      (`notification.actor`, `.isRead`, `.createdAt`, `.actorId`,
      `.referenceId`, `._id`) that don't exist on the real API response
      (`from_user`, `read`, `created_at`, `from_user_id`, `reference_id`,
      `id`). `formatDistanceToNow(undefined)` — date-fns given an undefined
      date — throws `RangeError: Invalid time value`, so **opening the bell
      dropdown or the notifications page with any real notification present
      would have crashed that render tree.** The page also independently
      read `data?.notifications` when `GET /api/notifications` returns a
      bare array, so the full notifications page showed zero notifications
      unconditionally, on top of the crash risk.
      The URL-routing logic was also duplicated three times (push-notification
      sender in `notifications.ts`, plus both components), each an
      incomplete, drifted mapping keyed off `type` instead of
      `reference_type` — e.g. nothing routed `answer`/`answer_accepted` to
      Q&A or `community_invite`/`community_approved` to a community; both
      fell through to a `/feed?post=` link.
      Fixed by adding `src/lib/notifications/url.ts` (`getNotificationUrl`)
      as the single source of truth for routing, used by all three
      call sites now, and correcting every field reference to match the
      real API response. Also wrapped `created_at` (an ISO string) in
      `new Date(...)` before handing it to `formatDistanceToNow` — even
      with the right field name, date-fns doesn't accept a raw string.
      **Why the existing tests never caught this:** `NotificationBell.test.tsx`
      mocked `formatDistanceToNow` entirely and always passed an empty
      notification array; `notifications/page.test.tsx` asserted the old,
      wrong shape (`{ notifications: [...] }`, `isRead`, `_id`) as if it
      were correct — it was validating the bug, not catching it. Rewrote
      both to use realistic data against the real `date-fns` implementation,
      and added `src/components/notifications/NotificationItem.test.tsx`
      (previously had zero dedicated coverage, only exercised indirectly
      via a mock in the page test) and `src/lib/notifications/url.test.ts`.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (594/594 passing).
      **Resolved as a same-day follow-up:** `inviteMember` and
      `approveMember` now select the community's `slug` (alongside `name`,
      already fetched) and store that in `reference_id` instead of the raw
      UUID, so `getNotificationUrl`'s `/c/${reference_id}` actually
      resolves against the live `/c/[slug]` route. Updated the two
      existing tests in `notification-triggers.test.ts` to assert on the
      slug rather than the id.
- [x] Extended notification triggers to three more real domains:
      - `answerQuestion` (content.ts) — notifies the question author when
        someone answers, skips self-answers.
      - `acceptAnswer` (content.ts) — notifies the answer author their
        answer was accepted (alongside the reputation award that already
        existed there).
      - `attendEvent` (events-jobs.ts) — notifies the event creator on an
        RSVP, skips self-RSVPs.
      Added 3 more tests to `src/tests/notification-triggers.test.ts` (7
      total in that file now). Intentionally did **not** add a notification
      for question upvotes (`voteQuestion`) — matches how Stack Overflow and
      similar sites treat votes as a lighter signal that doesn't warrant a
      notification per vote, avoiding spam on a popular question, unlike
      likes/comments which do notify.
      `marketplace/contact` doesn't need its own trigger — it opens a DM via
      `sendMessage`, which already notifies (see the messages fix above).
      **Not yet done:** community invites/approvals still have no
      notification trigger — tracked below.
- [x] Added notification triggers for community invites (`inviteMember` —
      notifies the invitee) and membership approval (`approveMember` —
      notifies the requester once approved) in `server/db/communities.ts`.
      2 more tests in `notification-triggers.test.ts` (9 total in that
      file). This closes out the notification-trigger gaps identified in
      this session — every core social action now notifies: likes,
      comments, replies, follows, mentions, messages, Q&A answers/accepted
      answers, event RSVPs, community invites/approvals.
- [x] Checked whether `api/messages` (send) notifies the recipient — it
      didn't, same root cause as everything else above. Fixed: `sendMessage`
      (messages.ts) now notifies every other conversation participant (not
      just a 1:1 peer — group conversations too) via
      `conversation_participants`, skipping the sender, with a truncated
      message preview. Best-effort — wrapped so a notification failure can
      never block message delivery itself. Not yet respecting per-conversation
      mute (`toggleMute` exists in messages.ts but isn't checked before
      notifying) — tracked as a follow-up, not blocking.
- [x] Respect conversation mute state before sending a message notification
      — `notifyOtherParticipants` (messages.ts) now filters participants with
      `.or("muted.is.null,muted.eq.false")` alongside the existing
      `neq(sender)` filter, so a muted participant no longer gets a
      notification for new messages in that conversation (still receives the
      message itself via realtime/fetch — only the notification is
      suppressed). Added a regression test in
      `notification-triggers.test.ts` asserting a muted participant is
      skipped while an unmuted one still gets notified.
      Verified with a clean `tsc --noEmit`, `next lint`, `jest --ci`
      (595/595 passing).
- [x] Messaging: read receipts + unread-per-conversation badge — both done
      via §4b (unread count fixed; read receipts now live after the
      ChatArea swap). Kept here as a pointer rather than duplicating detail.
- [x] Built shared `<EmptyState>`/`<ErrorState>`/`<LoadingState>` components
      (`src/components/ui/empty-state.tsx`) matching the visual pattern
      already established on most list pages (centered card, icon at
      reduced opacity, title, optional description, optional single action
      button) — a consolidation, not a redesign, so this carries near-zero
      visual risk. Migrated 8 pages that had a hand-rolled version of the
      same pattern with small inconsistencies (icon size, text scale,
      padding): `communities`, `find-experts`, `find-partners`, `jobs`,
      `events`, `q-and-a`, `resources`, `research`.
      Deliberately **not** migrated: `BookmarkedPostList.tsx`'s empty state
      uses a distinct branded icon-badge treatment (colored rounded square
      behind the icon) — that's a real design choice, not an inconsistency
      to mechanically flatten, so it was left as-is. `marketplace/page.tsx`
      has no empty-state handling to find in the first place (not checked
      further — out of scope for this pass, worth a look separately).
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`
      (whole-app, since 8 pages changed), `jest --ci` (581/581 passing).
      **Not visually verified in a browser** — same Chrome-permission
      blocker as the rest of this session's frontend work; low risk here
      specifically because the new component's markup/classes were copied
      directly from the existing per-page versions rather than invented.
- [ ] `ErrorState`/`LoadingState` (built alongside `EmptyState` above) have
      no call sites yet — `EmptyState` was the one with duplicated ad hoc
      versions to consolidate; error/loading states weren't audited for the
      same pattern in this pass. Worth checking whether pages have a
      similarly inconsistent error-state pattern worth consolidating, or
      whether they're better left page-specific.
- [x] Migrated 4 more pages to the shared `EmptyState`: `marketplace`
      ("No listings found", with the conditional Clear Filters action),
      `stories` ("No stories available"), `notifications` (both the
      "All caught up" and "No unread notifications" variants), and
      `admin/moderation` ("The moderation queue is empty").
      Deliberately **not** migrated: `leaderboard`'s empty state uses the
      same distinct branded icon-badge treatment as `BookmarkedPostList`
      (a colored circle behind the icon) plus a `Link`-based action —
      that's a real design choice already noted as intentional, not an
      inconsistency. `admin/users`' "No users found" lives inside a
      `<table>` row (`<td colSpan>`), not a card layout — `EmptyState`'s
      markup doesn't fit there. The three admin pages' "Access Denied"
      guards are a distinct concept (an auth guard, not an empty list) and
      were left as their own pattern rather than force-fit into
      `EmptyState`.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (601/601 passing).
- [x] **Mobile pass, part 1 — found and fixed a real layout bug in the
      highest-traffic mobile flow (opening a chat).** Swept `src/app` and
      `src/components` for the two most common mobile anti-patterns
      (fixed pixel widths that would overflow at 375px, unresponsive
      multi-column grids with no mobile-first default) — repo is largely
      clean on both; the couple of hits found (2-column onboarding
      button row, 3-column event-type picker) are legitimate at 375px, not
      bugs.
      The real find: `/messages` (mobile branch) rendered `ChatArea` nested
      inside the shared shell (`MainLayout`), which adds `pb-24` bottom
      padding *and* a `fixed` 49px+safe-area bottom tab bar on every page.
      `ChatArea` expects to own the full viewport (it renders its own
      header and pins its own composer to the bottom) — the two height
      systems weren't reconciled, so the message composer would end up
      partially hidden behind the fixed bottom nav. Root cause also
      affects the dedicated (but currently unreachable from any link —
      confirmed by grep, only reachable by typing the URL directly)
      `/messages/[id]` route, which additionally used a hardcoded
      `calc(100vh-61px)` that didn't match `MobileTopBar`'s real height
      (48px, not 61px).
      Fixed both: `/messages/page.tsx`'s mobile chat branch now renders
      `ChatArea` in a `fixed inset-0 z-[60]` overlay when a conversation is
      open, covering the full viewport above the shell's top bar (z-40) and
      bottom nav (z-50) rather than trying to keep two independent height
      calculations in sync. `main-layout.tsx` also gained an
      `isMobileConversationView` check (for the `/messages/[id]` route) that
      drops the shell's own padding and hides the bottom nav on that route
      too, and its height constant was corrected to the real 48px.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`
      (whole-app build since this touches the shared layout), and
      `jest --ci` (562/562 passing). **Not visually verified in a browser**
      — Chrome automation in this session is blocked on a host-permission
      grant only the user can make (see below); reasoning here is from
      tracing the actual CSS/z-index values against each other, not from
      seeing it render. Recommend a real click-through on a phone or
      responsive dev tools before fully trusting this.
- [ ] **Chrome DevTools/extension automation is blocked in this
      environment** — `mcp__claude-in-chrome__computer` (screenshot) fails
      with "Extension manifest must request permission to access the
      respective host" for `localhost`. This is a host-permission grant in
      the Chrome extension's own settings, not something fixable from
      inside a session. Grant it (extension icon → site permissions →
      allow `localhost`) to unblock live visual verification of this and
      future UI work.
- [ ] Mobile pass, part 2: everything beyond the messages flow above still
      needs an actual visual check (not just a static-code grep) at 375px —
      feed, profile, communities, marketplace, and modals in particular,
      since modals/dialogs are a common place for mobile overflow bugs that
      grep can't catch.
- [x] **Dark mode: found and fixed a token collision that made the entire
      shared skeleton library (and anything else using `bg-muted` as a
      visible surface) invisible specifically in dark mode.** `next-themes`
      + Tailwind's `class` strategy is wired correctly, and `globals.css`
      defines a full, matching set of light/dark CSS variables — this isn't
      a half-done dark mode. But `.dark { --muted: 18 18 18; ... --card: 18
      18 18; }` — the exact same RGB value. Light mode correctly gives
      `--muted`/`--accent`/`--secondary` a "next tier up" value distinct
      from `--card` (245,245,247 vs 255,255,255); dark mode has that same
      two-tier system for `accent`/`secondary` (28,28,30 vs `--card`'s
      18,18,18) but `--muted` was left equal to `--card` instead of getting
      the same treatment. This is exactly why the skeleton fix from §4
      earlier this session (switching `FeedContainer`'s bars to `bg-muted`)
      still wouldn't have been visible in dark mode specifically — the
      earlier fix was correct for light mode, this closes the gap for dark.
      Fixed by setting dark `--muted` to `28 28 30`, matching
      `--surface-hover`/`--accent`/`--secondary`'s existing "next elevation"
      value, restoring the same two-tier system light mode already has.
      Also swept for the other classic dark-mode bug (hardcoded
      `bg-white`/`bg-black`/`text-white`/`text-black` bypassing the token
      system) across 46 files — all legitimate: theme-adaptive colored
      buttons with white text, or intentionally theme-independent full-bleed
      surfaces (Stories viewer, image lightbox, video backgrounds). No
      further action needed there.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (562/562). **Not visually verified in a browser** — same
      Chrome-permission blocker as the mobile pass; this fix is derived
      directly from the CSS variable values themselves (not a guess), but a
      real look in dark mode is still worth doing once that's unblocked.
- [ ] Dark mode: full page-by-page visual check once the Chrome permission
      blocker is resolved — the token-level fix above should cascade
      correctly everywhere `bg-muted` is used, but hasn't been seen
      rendered.

## §4b — Messaging (Phase D of the UI pass, 2026-09-05)

- [x] **Unread badge showed "1" for every conversation with any unread
      message, never a real count.** `getConversations()` (messages.ts)
      computed `unreadCount` as a 0/1 boolean instead of counting actual
      unread messages, even though the live UI
      (`(components)/messages/ConversationListItem.tsx`) already renders it
      as a real number with a "99+" cap. Fixed to count every message from
      someone else newer than the viewer's `last_read_at` for that
      conversation (the full message list was already being fetched
      per-conversation, just not counted). Added
      `src/tests/messages-unread-count.test.ts` to lock it in.
- [x] **Major finding: there are two complete, parallel messaging UIs, and
      the more built one is dead code.** `src/components/messages/` (
      `ChatArea.tsx` 497 lines + `MessageBubble.tsx` 384 lines, plus
      `MessageComposer.tsx`, `TypingIndicator.tsx`, `GroupInfoPanel.tsx`) is
      a significantly more complete messaging UI — real read receipts
      (single/double/blue check marks), reply quoting, in-conversation
      search, mute/delete, voice/video call integration via `CallModal` —
      but **is imported by zero pages.** The live UI, wired into
      `/messages` and `/messages/[id]` on both desktop and mobile, is
      `src/app/(components)/messages/ChatWindow.tsx` (185 lines) +
      `ChatMessage.tsx` (157 lines), which is materially more basic and has
      no read-receipt UI at all.
      Confirmed by grepping every import of `ChatArea`/`ConversationList`
      under `src/app` — `src/components/messages/ConversationList.tsx` is
      *also* orphaned the same way; the live conversation list is
      `(components)/messages/ConversationListItem.tsx`.
      This also means `GET /api/messages`'s response shape is contested:
      the live `ChatWindow.tsx` expects a bare array (what the route
      currently returns); the orphaned `ChatArea.tsx` expects
      `{ messages: [...] }`. **Do not "fix" this shape without first
      deciding which UI ships** — attempted that fix in this session and
      reverted it once the orphaning was discovered, see the route's
      inline comment.
      **Resolved — user chose to swap to the built-out UI.** Done:
      - Verified every mutation/query `ChatArea`/`MessageComposer` use
        against `src/lib/api.ts` and the actual route files. Two were
        listed as endpoints but the route file didn't exist at all (not
        even a 501 stub): `api/conversations/delete` and
        `api/messages/search`. Implemented both — `deleteConversationForUser`
        and `searchMessages` in `server/db/messages.ts`, wired through new
        route files, matching the exact response shape each caller expects
        (`deleteConversation` returns `{success}`; `searchMessages` returns
        a bare array — `ChatArea` does `searchResults.map`, not
        `searchResults.messages.map`, confirmed by reading the call site
        before writing the route, not assumed).
      - Applied the `GET /api/messages` response-shape fix that was reverted
        earlier — now safe since `ChatArea` (which expects
        `{ messages: [...] }`) is becoming the only consumer.
      - Swapped `ChatWindow` → `ChatArea` in both
        `(dashboard)/messages/page.tsx` (desktop + mobile branches) and
        `(dashboard)/messages/[id]/page.tsx` (mobile deep link), wiring a
        real `onBack` handler (`router.push('/messages')`) since `ChatArea`
        takes one and `ChatWindow` didn't.
      - Deleted the now-fully-dead `ChatWindow.tsx`, `ChatMessage.tsx`, and
        `ChatInput.tsx` (all three orphaned — nothing else imported any of
        them).
      - Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`
        (all passed before the file deletions; jest re-run is pending as of
        this note — see commit for final status).
      - **Not done / explicitly deferred:** `GroupInfoPanel`'s pinned-
        messages and promote/demote-admin features hit a *deeper* gap than
        a missing route — `conversation_participants` has no admin/role
        column and `messages` has no pinned flag at the schema level. Building
        the routes wouldn't be enough; needs a migration first. Only
        surfaces when a user opens group info on a group conversation and
        tries those two specific actions — doesn't block 1:1 messaging or
        anything else in `ChatArea`. Tracked as its own line item below.
      - **Could not do a live interactive browser check** — Chrome
        automation tooling failed at the navigate/screenshot layer in this
        session (tab reported successful navigation then reverted to
        `chrome://newtab/` on every follow-up call, 3 attempts). Verification
        for this swap rests on: clean typecheck/lint/build, and manually
        tracing every mutation/query each component makes against the
        actual route files and their response shapes — not on seeing it
        render. Recommend an actual click-through before considering this
        fully done.
- [x] Added `supabase/migrations/20240108000000_conversation_roles_and_pinned_messages.sql`
      — `conversation_participants.role` (`owner`/`admin`/`member`, default
      `member`, CHECK-constrained) with a backfill that sets the
      conversation creator's row to `owner`, and `messages.pinned` +
      `messages.pinned_at`. Both additive/nullable-or-defaulted, safe against
      existing rows. **Same caveat as the other pending migrations: not
      applied to any live database yet** — no Supabase access this session.
      Implemented the two routes `GroupInfoPanel` needs against it:
      - `api/conversations/admin` (POST promote / DELETE demote) — added
        `promoteToAdmin`/`demoteFromAdmin` in `server/db/messages.ts`,
        which check the *acting* user is the group `owner` before allowing
        either (matches the UI, which only ever renders these controls for
        `isOwner`), not just that they're authenticated.
      - `api/conversations/pinned` (GET) — added `getPinnedMessages`,
        shaped to exactly what `GroupInfoPanel` reads off each row
        (`_id`, `senderName`, `content`).
      - `getConversationById` (used by `api/conversations/single`) now
        selects each participant's `role` and returns a `myRole` field for
        the requesting user — previously always `undefined`, which meant
        `isOwner`/`isAdmin` in `GroupInfoPanel` could never be true even
        with the schema in place.
      Added `src/tests/conversation-admin-pinned.test.ts` (8 tests): 401/400
      on both routes, 403 when a non-owner tries to promote or demote, 200
      + correct shape on success, and pinned-messages response shape.
      Verified with a clean `tsc --noEmit`, `next lint`, `npm run build`,
      `jest --ci` (613/613 passing).
- [x] `src/components/messages/ConversationList.tsx` was also dead code
      (same orphaning pattern as `ChatWindow` — the live conversation list
      is `(components)/messages/ConversationListItem.tsx`). Deleted.

## §5 — Test coverage for fixed stubs

Existing Playwright specs in `src/e2e/` are unauthenticated smoke tests
(page renders, nothing more) and can't exercise these ownership/auth-gated
flows without a live app + seeded DB session, which this environment
doesn't have. Used the same pattern as `marketplace-mutations.test.ts`
instead — Jest route-handler tests with a mocked Supabase client, runnable
right now with no live backend. Added
`src/tests/stub-routes-regression.test.ts` (10 tests, all passing):
questions/update (401, 403 non-author, 200 author), questions/delete (403
non-author), resources/update (403 non-uploader), resources/delete (200
uploader), search/posts (empty-query short-circuit + real match), and
communities/slug (400 missing slug, 404 not found).

- [x] Jest regression coverage for the previously-stubbed routes above
      (`src/tests/stub-routes-regression.test.ts`) — 557/557 tests passing
      repo-wide after adding it.
- [x] Added `src/tests/fixed-routes-coverage-2.test.ts` (8 tests) covering
      `hashtags/search` (empty-query short-circuit + real match),
      `reposts/check` (401 unauthenticated, 400 missing postId),
      `polls/single` (400 missing id, 404 not found), and
      `communities/members/remove` (403 non-moderator, 403 refuses to
      remove an admin). 575/575 tests passing repo-wide.
- [x] Added `src/tests/fixed-routes-coverage-3.test.ts` (23 tests) covering
      the remaining routes noted above: `communities/members/approve` (400
      missing fields, 403 propagated from a non-moderator, 200 success),
      `communities/invite/respond` (400 invalid status, 403 someone
      responding to another user's invite, 200 for the real invitee),
      `stories/user` (400 missing userId, 200 with data),
      `stories/delete` (401, 400, 403 non-owner), `marketplace/contact`
      (400 missing listingId, 404 unknown listing, 400 self-contact, 201 +
      conversation opened on success), `events/my-events` (401, 200),
      `reactions/counts` (400 missing targetId, default targetType),
      `comments/replies` (400 missing commentId, `hasMore` computed
      correctly), `posts/activity` (400 when signed out with no userId,
      defaults to the signed-in user's id otherwise).
      636/636 tests passing repo-wide.
- [ ] Real Playwright e2e (login → act → assert) for at least the highest-
      value flows once there's a way to run against a live/seeded
      environment — search, Q&A, resource download, community moderation,
      marketplace contact.

## §6 — Production readiness

- [x] Replace `docs/PHASE_8_FINAL_REPORT.md`'s false "certified" claim with
      an accurate status (link to the audit or this roadmap) — done via a
      correction banner (§10 of the earlier audit, commit `069050f`).
- [x] Reconcile `docs/PROJECT_AUDIT.md` QA tracker with actual state — same
      commit, added a note pointing to ROADMAP.md/TASKS.md as current truth.
- [ ] Re-run full audit checklist (build/lint/tsc/jest/security) before any
      real launch.
- [x] Delete `patch.js`, `refactor_ui.js`, `refactor_ui.py`,
      `skills_output*.txt` — confirmed unused by any tooling/CI, removed.
