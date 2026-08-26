# CAMPUS CONNECT — DATABASE SCHEMA & RLS AUDIT

**Database Engine:** PostgreSQL 15 (Supabase Hosted)  
**Migration File:** [`supabase/migrations/20240101000000_init.sql`](file:///D:/ON%20Going%20Projects/ON%20Going%20Projects/Campus%20Connect/supabase/migrations/20240101000000_init.sql) (919 lines)  
**Schema Health Score:** **85/100** (3 Critical Mismatches Identified)

---

## 1. Schema Inventory

```
Total Tables:              37
Total Performance Indexes: 27
Row-Level Security (RLS): 119 Policies (111 table + 8 storage)
Database Functions:         3
Database Triggers:          9
Storage Buckets:            2 ('media', 'avatars')
```

---

## 2. Table Catalog (37 Relational Tables)

| # | Table Name | Primary Key | Foreign Keys | RLS Status |
|---|---|---|---|:---:|
| 1 | `users` | `id (UUID)` | References `auth.users(id)` | Enabled |
| 2 | `follows` | `id (UUID)` | `follower_id`, `following_id` -> `users(id)` | Enabled |
| 3 | `posts` | `id (UUID)` | `author_id` -> `users(id)`, `community_id`, `poll_id` | Enabled |
| 4 | `comments` | `id (UUID)` | `post_id` -> `posts(id)`, `author_id` -> `users(id)`, `parent_id` | Enabled |
| 5 | `reactions` | `id (UUID)` | `user_id` -> `users(id)` | Enabled |
| 6 | `bookmarks` | `id (UUID)` | `user_id` -> `users(id)`, `post_id` -> `posts(id)` | Enabled |
| 7 | `hashtags` | `id (UUID)` | Unique tag name | Enabled |
| 8 | `post_hashtags` | `(post_id, hashtag_id)` | Junction table to `posts` and `hashtags` | Enabled |
| 9 | `conversations` | `id (UUID)` | `created_by` -> `users(id)` | Enabled |
| 10 | `conversation_participants` | `(conversation_id, user_id)` | Junction to `conversations` and `users` | Enabled |
| 11 | `messages` | `id (UUID)` | `conversation_id`, `sender_id` -> `users(id)` | Enabled |
| 12 | `communities` | `id (UUID)` | `created_by` -> `users(id)`, Unique `slug` | Enabled |
| 13 | `community_members` | `(community_id, user_id)` | Junction with `role` enum | Enabled |
| 14 | `community_invites` | `id (UUID)` | `community_id`, `inviter_id`, `invitee_id` | Enabled |
| 15 | `events` | `id (UUID)` | `created_by` -> `users(id)` | Enabled |
| 16 | `event_attendees` | `(event_id, user_id)` | Junction with `status` | Enabled |
| 17 | `jobs` | `id (UUID)` | `posted_by` -> `users(id)` | Enabled |
| 18 | `job_applications` | `id (UUID)` | `job_id` -> `jobs(id)`, `applicant_id` -> `users(id)` | Enabled |
| 19 | `stories` | `id (UUID)` | `author_id` -> `users(id)` | Enabled |
| 20 | `story_views` | `(story_id, viewer_id)` | Junction with `viewed_at` | Enabled |
| 21 | `notifications` | `id (UUID)` | `user_id` -> `users(id)`, `from_user_id` | Enabled |
| 22 | `polls` | `id (UUID)` | `created_by` -> `users(id)` | Enabled |
| 23 | `poll_votes` | `(poll_id, user_id)` | Junction recording `option_index` | Enabled |
| 24 | `reposts` | `id (UUID)` | `original_post_id` -> `posts(id)`, `reposter_id` | Enabled |
| 25 | `questions` | `id (UUID)` | `author_id` -> `users(id)` | Enabled |
| 26 | `question_answers` | `id (UUID)` | `question_id` -> `questions(id)`, `author_id` | Enabled |
| 27 | `resources` | `id (UUID)` | `uploaded_by` -> `users(id)` | Enabled |
| 28 | `research_papers` | `id (UUID)` | `uploaded_by` -> `users(id)` | Enabled |
| 29 | `marketplace_listings` | `id (UUID)` | `posted_by` -> `users(id)` | Enabled |
| 30 | `skill_endorsements` | `(user_id, endorser_id, skill)` | Junction recording endorsements | Enabled |
| 31 | `portfolio_projects` | `id (UUID)` | `user_id` -> `users(id)` | Enabled |
| 32 | `portfolio_certifications` | `id (UUID)` | `user_id` -> `users(id)` | Enabled |
| 33 | `ads` | `id (UUID)` | `created_by` -> `users(id)` | Enabled |
| 34 | `presence` | `user_id (UUID)` | References `users(id)` | Enabled |
| 35 | `user_reputation` | `user_id (UUID)` | References `users(id)` | Enabled |
| 36 | `content_reports` | `id (UUID)` | `reporter_id` -> `users(id)` | Enabled |
| 37 | `course_enrollments` | `(user_id, course_code)` | Academic course linking | Enabled |

---

## 3. Database Functions & Triggers

### 3.1 Functions
1. `increment_field(table_name TEXT, row_id UUID, field_name TEXT, amount INT)`: Atomic counter increment/decrement to prevent lost updates on likes, comments, and member counts.
2. `update_updated_at()`: Automatically bumps `updated_at` column timestamp before row update.
3. `handle_new_user()`: Invoked on `auth.users` insert; automatically provisions corresponding rows in `public.users`, `public.user_reputation`, and `public.presence`.

### 3.2 Storage Buckets
- `media`: 50MB max file size; allows images, videos, and PDFs. 4 RLS policies configured.
- `avatars`: 5MB max file size; allows image MIME types. 4 RLS policies configured.

---

## 4. Code vs Schema Discrepancies (Blockers)

| # | Discrepancy Description | Code Location | Migration Impact | Severity |
|---|---|---|---|:---:|
| 1 | **Missing `calls` Table** | `src/server/db/misc.ts:L108-150` | Table `calls` is completely absent from `init.sql`. All `/api/calls/*` mutations fail. | **P0 Block** |
| 2 | **Missing `questions.is_resolved` Column** | `src/server/db/content.ts:L141` | `acceptAnswer()` executes `.update({ is_resolved: true })` on `questions`, but column is missing. | **P0 Block** |
| 3 | **`jobs.employment_type` vs `jobs.type`** | `src/server/db/events-jobs.ts:L54` | Code executes `.eq("employment_type", filters.type)` while schema column name is `type`. | **P0 Bug** |
| 4 | **Hardcoded Password** | `setup-realtime.js:L3` | Contains literal password string in connection URI. | **P1 Sec** |
| 5 | **Migration Runner Path Mismatch** | `run-migration.js:L15` | Script attempts to read `supabase/migration.sql` instead of `supabase/migrations/20240101000000_init.sql`. | **P2 Dev** |
