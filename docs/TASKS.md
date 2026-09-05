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
- [ ] **Semantic research search degrades silently without `OPENAI_API_KEY`**
      — falls back to `MockEmbeddingProvider`, a deterministic hash, not a
      real embedding. Confirmed `OPENAI_API_KEY` is unset in `.env.local`
      right now. Either set a real key (production too, if also unset there)
      or make the degraded mode visible to users/logs instead of silent.
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
      the first time a real client sent one. Fixed by dropping the field at
      the API boundary; a real fix is either adding the column or removing
      it from the frontend form (tracked below).
- [ ] Add a `course` column to `questions` (or remove the field from
      `AskQuestionModal.tsx`) to resolve the frontend/schema mismatch found
      above.
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
        was fully broken, not just unvalidated. Fixed: map fields and
        convert timestamps to ISO strings; drop the two unsupported fields.
      - `api/jobs` (create) — frontend's `type` field is `'job' |
        'internship'`, but the `jobs.type` CHECK constraint only allows
        `full_time`/`part_time`/`internship`/`contract` — **`'job'` would
        violate the constraint and fail the insert on every full-time
        posting**, the most common case. Also `skillsRequired` needed
        mapping to the `skills` column; `remote`/`duration` have no column.
        Fixed: map `'job'` → `'full_time'`, `skillsRequired` → `skills`,
        drop `remote`/`duration`.
      - `api/marketplace/update` — frontend sends a `condition` field with
        no matching column. Fixed: accept and drop it.
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
- [ ] Decide whether `virtualLink`/`maxAttendees` (events) and
      `remote`/`duration` (jobs) get real columns via a migration, or get
      removed from their forms — currently silently dropped, same open
      decision as `questions.course`.
- [x] Checked the marketplace **create** form (`CreateListingModal.tsx`)
      against this same pattern — 5th hit: it sends `condition` and
      `university`, neither of which exist on `marketplace_listings`. Not
      currently broken like the other three, though: the Zod schema added
      earlier this session for `api/marketplace` POST doesn't declare those
      fields, and Zod's default `.parse()` silently strips unrecognized
      keys rather than erroring — so the listing still saves, it just
      quietly loses the condition/university the user typed. Same "needs a
      migration or form change" decision as the other fields above, just
      non-crashing.
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
- [ ] **Not yet swept:** 61 files in `src/` use `animate-pulse` for loading
      states; only the feed and suggested-users widgets were checked
      component-by-component for the bg-card-on-bg-card bug above. Worth a
      dedicated pass to confirm the rest don't have the same contrast bug —
      tracked here rather than assumed clean.
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
- [ ] Notifications: grouped notifications ("X and N others..."). Now that
      notifications are actually created, a popular post will generate one
      row per like — grouping/collapsing in the UI is a real next step, not
      just a nice-to-have.
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
- [ ] Respect conversation mute state before sending a message notification
      (`toggleMute` in messages.ts sets it but `notifyOtherParticipants`
      doesn't check it yet).
- [x] Messaging: read receipts + unread-per-conversation badge — both done
      via §4b (unread count fixed; read receipts now live after the
      ChatArea swap). Kept here as a pointer rather than duplicating detail.
- [ ] Build one shared `<EmptyState>` / `<ErrorState>` / `<LoadingState>`
      component set and replace ad hoc per-page versions.
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
- [ ] Add an admin/role column to `conversation_participants` and a
      `pinned`/`pinned_at` column to `messages` (migration), then implement
      `api/conversations/admin` (promote/demote) and
      `api/conversations/pinned` (GET) so `GroupInfoPanel`'s admin controls
      and pinned-messages tab actually work instead of hitting a 404.
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
- [ ] Extend the same file (or add siblings) for the remaining fixed routes
      not yet covered: communities/members/{approve,remove}, invite/respond,
      stories/{user,delete}, marketplace/contact, events/my-events,
      reactions/counts, polls/single, hashtags/search, comments/replies,
      posts/activity.
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
