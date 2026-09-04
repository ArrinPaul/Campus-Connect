# Campus Connect — Roadmap to a Real, Facebook-Grade Product

Source of truth for where the project is and where it's going. Written from the
2026-09-05 forensic audit (full report was published as an artifact in that
session — ask the maintainer for the link if you need the raw findings). This
file is the plan; `docs/TASKS.md` is the checklist derived from it. Keep both
updated as work lands — check items off in TASKS.md in the same commit that
does the work, don't batch it.

## Where we actually are

- Stack is solid and builds clean: Next.js 14 (App Router) + Supabase +
  TypeScript strict. `npm run build`, `next lint`, `tsc --noEmit` all pass.
  547 Jest tests pass.
- ~90% UI complete, ~78% backend complete, ~65% end-to-end complete.
- The gap is a half-finished backend migration: 30 of 174 API routes were
  scaffolded as literal `501 Not Implemented` stubs and never finished.
- One committed doc (`docs/PHASE_8_FINAL_REPORT.md`) falsely claims
  "production certified" — do not trust it. `docs/PROJECT_AUDIT.md` next to
  it (correctly) shows QA as never completed. Both are being superseded by
  this file.
- A live Supabase service-role key and DB password were committed to git in
  `seed.js` / `test_db.js`. This is P0 and independent of everything else.

## Phases

### Phase 0 — Stop the bleeding (security)
Rotate leaked credentials, remove the files, stop trusting the false "certified" doc.
Nothing else matters until this is done. See TASKS.md §0.

### Phase 1 — Make every route real
Implement the 30 stub endpoints so every advertised feature actually works
server-side. This is the bulk of "functional, not just pretty." See TASKS.md §1.

### Phase 2 — Data integrity
Fix the duplicate/incompatible `subscriptions` schema, add Zod validation on
write paths, confirm RLS gaps (`notifications` insert policy). See TASKS.md §2.

### Phase 3 — Realtime & calls hardening
Add a TURN server so calls work off-LAN; add reconnect/backoff to realtime
hooks. See TASKS.md §3.

### Phase 4 — UI pass: "feel like Facebook"
Once the data layer is trustworthy, do a full UI/UX pass — see "What 'Facebook-grade
UI' means here" below and TASKS.md §4.

### Phase 5 — Test coverage for what we just fixed
The stub routes had zero e2e coverage (that's exactly why nobody caught them).
Every domain fixed in Phase 1 gets a Playwright spec before it's considered done.
See TASKS.md §5.

### Phase 6 — Production readiness
Docs cleanup, monitoring verification, final pre-launch checklist. See TASKS.md §6.

## What "Facebook-grade UI" means here

Not a redesign from scratch — the design system (Radix + Tailwind + Tiptap)
is already reasonable. "Facebook-grade" means matching the *behavior* users
expect from a mature social product, specifically:

- **Feed**: infinite scroll with virtualization (already have
  `@tanstack/react-virtual` — confirm it's actually applied to the feed),
  optimistic post/comment/reaction updates, skeleton loaders (not spinners)
  on first load, inline media lightbox.
- **Composer**: sticky/persistent composer, drag-drop image/video attach,
  @mention and #hashtag autocomplete (Tiptap mention extension is already a
  dependency — confirm it's wired into the post composer, not just the
  editor showcase).
- **Notifications**: live badge count via the realtime channel that already
  exists, grouped notifications ("X and 4 others liked your post"), mark-all-read.
- **Messaging**: read receipts, typing indicator (already realtime-backed),
  unread badge per conversation, message reactions.
- **Navigation**: consistent empty/loading/error state per page — audit
  found this is inconsistent; make it a shared component used everywhere.
- **Responsiveness**: every page usable at 375px width, not just desktop.
- **Dark mode**: `next-themes` is already installed — confirm every page
  respects it, not just the shell.

Each of these becomes its own checklist row in TASKS.md §4 rather than one
vague "make it nice" task.

## Working agreement for this effort

- No destructive git operations without asking (no history rewrite, no force
  push) — flagged explicitly when a step needs it (credential rotation /
  history scrub).
- Every stub route fix: implement the DB layer function in `src/server/db/*`
  following the existing pattern (see `content.ts` `getPaperById` /
  `updatePaper` / `deletePaper` as the reference implementation), then wire
  the route exactly like its sibling non-stub routes (see `research/single`,
  `research/update`, `research/delete` as the reference routes).
- Commits only when explicitly asked, per standing instructions — otherwise
  work stays in the working tree until you say "commit this."
