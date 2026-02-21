# Campus Connect — Actionable Todo List

> Broken down by category. Each task is small, executable, and ordered by priority.
> Target: Production stability for 10,000 users.
> Generated: February 2026

---

## Legend

- **Priority**: P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)
- **Difficulty**: Easy (< 1hr) | Moderate (1hr - 1 day) | Hard (1-3 days)
- **Status**: ⬜ Not started | 🔄 In progress | ✅ Done

---

## Security Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| S1 | Rewrite `sanitizeMarkdown()` in `convex/sanitize.ts` — switch from regex denylist to stripping ALL HTML tags (allowlist approach). Preserve Markdown syntax only. | P0 | Moderate | None | ✅ |
| S2 | Rewrite `sanitizeText()` in `convex/sanitize.ts` — strip all HTML tags then HTML-encode the result. Remove regex denylist. | P0 | Easy | None | ✅ |
| S3 | Add `sanitizeMarkdown()` call to `sendMessage` in `convex/messages.ts` before storing content | P0 | Easy | S1 | ✅ |
| S4 | Remove wildcard `.vercel.app` CORS check in `convex/http.ts` — replace with exact domain match | P1 | Easy | None | ✅ |
| S5 | Add URL protocol validation helper in `convex/sanitize.ts` — allowlist `https://` only for user-supplied URLs | P1 | Easy | None | ✅ |
| S6 | Apply URL validation to `mediaUrls` in `convex/posts.ts` `createPost` mutation | P1 | Easy | S5 | ✅ |
| S7 | Apply URL validation to social links in `convex/users.ts` `updateProfile` — replace `sanitizeText()` on URLs | P1 | Easy | S5 | ✅ |
| S8 | Add search query length limit (max 200 chars) to all search endpoints in `convex/search.ts` | P2 | Easy | None | ✅ |
| S9 | Add notification message sanitization in `convex/notifications.ts` | P2 | Easy | S1 | ✅ |

---

## Backend Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| B1 | Replace in-memory rate limiter with Upstash Redis in `src/lib/rate-limit.ts` — keep fallback to in-memory if Redis unavailable | P1 | Moderate | None | ✅ |
| B2 | Remove mention resolution full-table-scan fallback in `convex/posts.ts` (lines ~227-232) — if username index miss, skip silently | P1 | Easy | None | ✅ |
| B3 | Add `.take()` limits to all `.collect()` calls in `convex/search.ts` — cap `universalSearch` to `.take(200)` per category | P1 | Easy | None | ✅ |
| B4 | Add `.take()` limit to `searchUsers` in `convex/users.ts` — currently unbounded `.collect()` | P1 | Easy | None | ✅ |
| B5 | Wrap cursor resolution in try/catch in `convex/posts.ts` — return empty results for invalid cursors | P2 | Easy | None | ✅ |
| B6 | Add cursor validation in `convex/search.ts` — validate `parseInt` result is not `NaN` | P2 | Easy | None | ✅ |
| B7 | Add cursor validation in `convex/feed-ranking.ts` — same pattern | P2 | Easy | None | ✅ |
| B8 | Add typing indicator cleanup cron in `convex/crons.ts` — delete entries older than 30s | P3 | Easy | None | ⬜ |

---

## Database Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| D1 | Create `convex/validation-constants.ts` — shared max-length constants (POST_MAX=5000, COMMENT_MAX=2000, BIO_MAX=500, MESSAGE_MAX=5000, SEARCH_QUERY_MAX=200, SKILL_MAX=50) | P1 | Easy | None | ✅ |
| D2 | Import constants from D1 into `convex/posts.ts`, `convex/messages.ts`, `convex/users.ts`, `convex/search.ts`, `convex/comments.ts` | P1 | Moderate | D1 | ✅ |
| D3 | Import constants from D1 into client `lib/validations.ts` — replace hardcoded values | P1 | Easy | D1 | ✅ |

---

## Authentication Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| A1 | Stop running `sanitizeText()` on social link URLs in `convex/users.ts` — use URL validation instead | P1 | Easy | S5 | ✅ |

> Note: Authentication itself (Clerk) is solid. The only auth-adjacent issue is URL sanitization breaking valid URLs.

---

## DevOps Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| O1 | Add `npm audit --audit-level=high` step to `.github/workflows/ci.yml` after npm ci | P1 | Easy | None | ✅ |
| O2 | Add `--coverageThreshold` to Jest command in CI — branches:50, functions:60, lines:60 | P2 | Easy | None | ✅ |

---

## Testing Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| T1 | Add unit tests for rewritten `sanitizeText()` and `sanitizeMarkdown()` — verify XSS vectors are blocked | P0 | Moderate | S1, S2 | ✅ |
| T2 | Add unit test for `isValidUrl()` helper — verify protocol allowlist | P1 | Easy | S5 | ✅ |
| T3 | Add test for rate limiter Redis integration (mock Upstash) | P2 | Moderate | B1 | ⬜ |

---

## Frontend Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| F1 | Install `sonner` toast library and add `<Toaster>` to root layout | P1 | Easy | None | ✅ |
| F2 | Add success/error toasts to bookmark mutations | P2 | Easy | F1 | ✅ |
| F3 | Add success/error toasts to reaction mutations | P2 | Easy | F1 | ✅ |
| F4 | Add success/error toasts to comment mutations | P2 | Easy | F1 | ⬜ |
| F5 | Add success/error toasts to follow mutations | P2 | Easy | F1 | ✅ |
| F6 | Add error toast to post creation failure | P2 | Easy | F1 | ✅ |

---

## Code Quality Tasks

| # | Task | Priority | Difficulty | Dependencies | Status |
|---|------|----------|------------|--------------|--------|
| Q1 | Replace `any` types in `convex/messages.ts` helpers (`getCurrentUser`, `verifyParticipant`) with `QueryCtx`/`MutationCtx` | P2 | Easy | None | ✅ |
| Q2 | Replace `any` type for `updates` object in `convex/users.ts` `updateProfile` with proper interface | P2 | Easy | None | ✅ |
| Q3 | Add log level filtering to `convex/logger.ts` — skip debug in production | P3 | Easy | None | ✅ |

---

## Implementation Order

Execute in this exact sequence:

### Phase 1 — Critical Security (Day 1)
1. S1 → S2 → T1 (Sanitization rewrite + tests)
2. S3 (Message sanitization)
3. S4 (CORS fix)

### Phase 2 — High Security + Auth (Day 2)
4. S5 → S6 → S7 → T2 (URL validation)
5. A1 (Social link fix — depends on S5)
6. B1 (Rate limiter upgrade)

### Phase 3 — Backend Stability (Day 3)
7. D1 → D2 → D3 (Validation constants)
8. B2 (Mention scan fix)
9. B3 → B4 (Query limits)
10. B5 → B6 → B7 (Cursor safety)
11. S8 (Search query limit)

### Phase 4 — DevOps (Day 4)
12. O1 (npm audit in CI)
13. O2 (Coverage threshold)

### Phase 5 — Frontend UX (Day 4-5)
14. F1 (Toast library)
15. F2 → F3 → F4 → F5 → F6 (Toast integration)

### Phase 6 — Code Quality (Day 5)
16. Q1 → Q2 (TypeScript types)
17. Q3 (Logger)
18. B8 (Typing indicator cleanup)
19. S9 (Notification sanitization)

---

**Total estimated effort: 5 working days**
