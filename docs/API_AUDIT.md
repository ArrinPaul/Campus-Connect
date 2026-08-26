# CAMPUS CONNECT — COMPLETE API ROUTE INVENTORY & AUDIT

**Total Route Handler Files:** 167  
**Active & Functional:** 113 (67.7%)  
**Scaffolded 501 Stubs:** 54 (32.3%)  
**Placeholders / Aux Stubs:** 4 (Cron batching, push subscribe, stripe subscriptions)  
**Standard Response Headers:** JSON (`Content-Type: application/json`), Cache-Control on public endpoints, Rate limiting headers (`Retry-After: 60`).

---

## 1. Domain Summary

| Domain Directory | Total Routes | Active / Functional | 501 Stubs | Auth Enforced? | DB Connection | Status |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `src/app/api/admin/` | 3 | 3 | 0 | Yes (RBAC Admin) | Direct Supabase | **IMPLEMENTED** |
| `src/app/api/ads/` | 7 | 5 | 2 | Partial (POST auth) | `misc.ts` + Direct | **IMPLEMENTED** |
| `src/app/api/auth/` | 4 | 4 | 0 | Cookie Client | `@supabase/ssr` | **IMPLEMENTED** |
| `src/app/api/bookmarks/` | 4 | 4 | 0 | Yes (401) | `bookmarks.ts` | **IMPLEMENTED** |
| `src/app/api/calls/` | 6 | 6 | 0 | Yes (401) | `misc.ts` | **BROKEN** (Missing DB Table) |
| `src/app/api/comments/` | 3 | 2 | 1 | Yes (401) | `comments.ts` | **IMPLEMENTED** |
| `src/app/api/communities/` | 12 | 8 | 4 | Mixed | `communities.ts` | **IMPLEMENTED** |
| `src/app/api/conversations/` | 7 | 7 | 0 | Yes (401) | `messages.ts` | **IMPLEMENTED** |
| `src/app/api/courses/` | 1 | 1 | 0 | Yes (401) | Direct Supabase | **IMPLEMENTED** |
| `src/app/api/cron/` | 2 | 0 | 0 | Public / Token | None (Placeholder) | **STUB** |
| `src/app/api/events/` | 6 | 3 | 3 | Mixed | `events-jobs.ts` | **IMPLEMENTED** |
| `src/app/api/follows/` | 6 | 6 | 0 | Mixed | `follows.ts` | **IMPLEMENTED** |
| `src/app/api/graph/` | 2 | 2 | 0 | Mixed | `posts.ts` / `follows.ts` | **IMPLEMENTED** |
| `src/app/api/hashtags/` | 3 | 2 | 1 | Public | `hashtags.ts` | **IMPLEMENTED** |
| `src/app/api/jobs/` | 7 | 4 | 3 | Mixed | `events-jobs.ts` | **IMPLEMENTED** |
| `src/app/api/marketplace/` | 6 | 4 | 2 | Mixed | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/matching/` | 2 | 0 | 2 | Mixed | None | **STUB** |
| `src/app/api/media/` | 2 | 1 | 1 | Yes (401) | Supabase Storage | **IMPLEMENTED** |
| `src/app/api/messages/` | 4 | 3 | 1 | Yes (401) | `messages.ts` | **IMPLEMENTED** |
| `src/app/api/monitoring/` | 1 | 0 | 1 | Public | None | **STUB** |
| `src/app/api/notifications/` | 4 | 4 | 0 | Yes (401) | `notifications.ts` | **IMPLEMENTED** |
| `src/app/api/polls/` | 3 | 2 | 1 | Mixed | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/portfolio/` | 3 | 1 | 2 | Yes (401) | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/posts/` | 9 | 8 | 1 | Mixed | `posts.ts` | **IMPLEMENTED** |
| `src/app/api/presence/` | 2 | 1 | 1 | Mixed | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/push/` | 5 | 0 | 4 | Public | None | **STUB** |
| `src/app/api/questions/` | 9 | 4 | 5 | Mixed | `content.ts` | **IMPLEMENTED** |
| `src/app/api/reactions/` | 4 | 3 | 1 | Yes (401) | `reactions.ts` | **IMPLEMENTED** |
| `src/app/api/reports/` | 1 | 1 | 0 | Yes (401) | Direct Supabase | **IMPLEMENTED** |
| `src/app/api/reposts/` | 3 | 2 | 1 | Yes (401) | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/research/` | 8 | 2 | 6 | Mixed | `content.ts` | **IMPLEMENTED** |
| `src/app/api/resources/` | 6 | 2 | 4 | Mixed | `content.ts` | **IMPLEMENTED** |
| `src/app/api/search/` | 4 | 1 | 3 | Public | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/skills/` | 2 | 2 | 0 | Mixed | `misc.ts` | **IMPLEMENTED** |
| `src/app/api/stories/` | 4 | 2 | 2 | Yes (401) | `content.ts` | **IMPLEMENTED** |
| `src/app/api/subscriptions/` | 3 | 0 | 2 | Public | None | **STUB** |
| `src/app/api/users/` | 10 | 10 | 0 | Yes (401) | `users.ts` | **IMPLEMENTED** |
| **TOTALS** | **167** | **113** | **54** | - | - | **67.7% Active** |

---

## 2. Active Core API Route Specifications

### 2.1 Posts & Feed
- `POST /api/posts`: Auth required (`supabase.auth.getUser()`). Validates trimmed content non-empty, runs `DOMPurify.sanitize()`, inserts via `posts.createPost()`, indexes `#hashtags`. Returns HTTP 201 with `DbPost`.
- `GET /api/posts/feed`: Auth required. Returns `{ posts: DbPost[], hasMore: boolean }` sorted by personalized engagement + affinity decay ranking algorithm.
- `GET /api/posts/explore`: Public. Returns top public posts by engagement.
- `GET /api/posts/single?id=...`: Public. Returns single post with author join relation.
- `PATCH /api/posts/update`: Auth required. Verifies post authorship before updating content.
- `DELETE /api/posts/delete`: Auth required. Verifies post authorship before soft/hard deletion.

### 2.2 Messages & Conversations
- `GET /api/conversations`: Auth required. Fetches user conversations with participant models and calculated unread counts.
- `POST /api/conversations`: Auth required. Opens 1:1 direct message or creates multi-participant group conversation.
- `GET /api/messages?conversationId=...`: Auth required. Returns paginated messages with cursor.
- `POST /api/messages`: Auth required. Validates `content.length <= 5000`, inserts message, updates conversation `updated_at`.
- `POST /api/messages/read`: Auth required. Updates caller's `last_read_at` timestamp.

### 2.3 Users & Auth
- `POST /api/auth/sign-up`: Validates email/password, triggers Supabase Auth registration.
- `POST /api/auth/sign-in`: Validates credentials, sets SSR session cookies.
- `POST /api/auth/sign-out`: Calls `supabase.auth.signOut()`, clears session cookies.
- `GET /api/users/me`: Auth required. Returns caller profile with Redis cache fallback.
- `PATCH /api/users/me`: Auth required. Strict whitelist validation (`name`, `bio`, `university`, `role`, `skills`), rejects tampering with admin flags.
- `DELETE /api/users/me`: Auth required. Validates `confirm === true`, sets `deleted_at = now()` (30-day soft delete).
- `POST /api/users/onboarding`: Auth required. Sets `onboarding_completed = true` and updates profile fields.

---

## 3. Inventory of 54 Scaffolded 501 Stubs

All endpoints below return HTTP `501 Not Implemented` with `{ error: "Not implemented", message: "Endpoint scaffolded during backend migration. Implement business logic as needed." }`:

1. `/api/ads/pause`
2. `/api/ads/update`
3. `/api/comments/replies` *(Handled via `/api/comments` directly)*
4. `/api/communities/invite/respond`
5. `/api/communities/members/approve`
6. `/api/communities/members/remove`
7. `/api/communities/slug` *(Handled via `/api/communities` filter)*
8. `/api/events/delete`
9. `/api/events/my-events`
10. `/api/events/update`
11. `/api/hashtags/search`
12. `/api/jobs/delete`
13. `/api/jobs/job-applications`
14. `/api/jobs/update`
15. `/api/marketplace/contact` *(Handled via DM directly)*
16. `/api/marketplace/my-listings`
17. `/api/matching`
18. `/api/matching/score`
19. `/api/media/confirm`
20. `/api/messages/typing` *(Handled via client Presence directly)*
21. `/api/monitoring/error`
22. `/api/polls/single`
23. `/api/portfolio/certifications`
24. `/api/portfolio/projects`
25. `/api/posts/activity`
26. `/api/presence/status`
27. `/api/push/endpoint`
28. `/api/push/preferences`
29. `/api/push/unsubscribe`
30. `/api/push/vapid-key`
31. `/api/questions/answers` *(Handled via `/api/questions/single`)*
32. `/api/questions/delete`
33. `/api/questions/search`
34. `/api/questions/update`
35. `/api/questions/vote`
36. `/api/reactions/counts`
37. `/api/reposts/check`
38. `/api/research/delete`
39. `/api/research/review`
40. `/api/research/search`
41. `/api/research/single`
42. `/api/research/update`
43. `/api/research/vote`
44. `/api/resources/delete`
45. `/api/resources/download`
46. `/api/resources/single`
47. `/api/resources/update`
48. `/api/search/communities`
49. `/api/search/posts`
50. `/api/search/users`
51. `/api/stories/delete`
52. `/api/stories/user`
53. `/api/subscriptions/cancel`
54. `/api/subscriptions/checkout`
