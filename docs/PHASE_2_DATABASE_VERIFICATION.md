# CAMPUS CONNECT — PHASE 2 DATABASE VERIFICATION REPORT

**Database Engine:** PostgreSQL 15 (Supabase)  
**Migration Path:** `supabase/migrations/20240101000000_init.sql` (949 lines)  
**Verification Date:** August 27, 2026  
**Status:** **100% CODE-TO-SCHEMA INTEGRITY VERIFIED**

---

## 1. Verified Schema Summary

```
Total Relational Tables:     38 (37 Original + Table 38 'calls')
Total Performance Indexes:   30 (27 Original + 3 'calls' Indexes)
Row-Level Security Policies: 122 (114 Table + 8 Storage)
Database Functions:           3 (increment_field, update_updated_at, handle_new_user)
Database Triggers:           10 (9 updated_at + 1 on_auth_user_created)
Storage Buckets:              2 ('media' - 50MB, 'avatars' - 5MB)
```

---

## 2. Table Catalog (38 Tables Verified)

| # | Table Name | Columns Verified | Primary Key | Foreign Key Constraints | RLS Enabled? |
|---|---|---|---|---|:---:|
| 1 | `users` | 13 columns (name, bio, role, university, is_admin, etc.) | `id` | `auth.users(id)` | ✓ |
| 2 | `follows` | 5 columns | `id` | `follower_id`, `following_id` -> `users(id)` | ✓ |
| 3 | `posts` | 13 columns (content, media, is_anonymous, etc.) | `id` | `author_id` -> `users(id)`, `community_id`, `poll_id` | ✓ |
| 4 | `comments` | 7 columns | `id` | `post_id` -> `posts(id)`, `author_id` -> `users(id)`, `parent_id` | ✓ |
| 5 | `reactions` | 5 columns (`type`, `target_id`, `target_type`) | `id` | `user_id` -> `users(id)` | ✓ |
| 6 | `bookmarks` | 5 columns (`collection_name`, `post_id`) | `id` | `user_id` -> `users(id)`, `post_id` -> `posts(id)` | ✓ |
| 7 | `hashtags` | 4 columns (`tag`, `post_count`) | `id` | Unique `tag` index | ✓ |
| 8 | `post_hashtags` | 2 columns | `(post_id, hashtag_id)` | Junction | ✓ |
| 9 | `conversations` | 5 columns (`name`, `is_group`, `created_by`) | `id` | `created_by` -> `users(id)` | ✓ |
| 10 | `conversation_participants` | 4 columns (`last_read_at`, `is_muted`) | `(conversation_id, user_id)` | Junction | ✓ |
| 11 | `messages` | 8 columns (`content`, `type`, `media_url`) | `id` | `conversation_id`, `sender_id` -> `users(id)` | ✓ |
| 12 | `communities` | 9 columns (`name`, `slug`, `category`, `privacy`) | `id` | `created_by` -> `users(id)` | ✓ |
| 13 | `community_members` | 4 columns (`role`) | `(community_id, user_id)` | Junction | ✓ |
| 14 | `community_invites` | 6 columns (`status`) | `id` | `community_id`, `inviter_id`, `invitee_id` | ✓ |
| 15 | `events` | 11 columns (`title`, `event_type`, `start_time`) | `id` | `created_by` -> `users(id)` | ✓ |
| 16 | `event_attendees` | 3 columns (`status`) | `(event_id, user_id)` | Junction | ✓ |
| 17 | `jobs` | 13 columns (`title`, `company`, `type`, `salary`) | `id` | `posted_by` -> `users(id)` | ✓ |
| 18 | `job_applications` | 7 columns (`cover_letter`, `status`) | `id` | `job_id` -> `jobs(id)`, `applicant_id` -> `users(id)` | ✓ |
| 19 | `stories` | 8 columns (`content`, `media_url`, `expires_at`) | `id` | `author_id` -> `users(id)` | ✓ |
| 20 | `story_views` | 3 columns | `(story_id, viewer_id)` | Junction | ✓ |
| 21 | `notifications` | 9 columns (`type`, `message`, `read`) | `id` | `user_id` -> `users(id)`, `from_user_id` | ✓ |
| 22 | `polls` | 6 columns (`question`, `options`, `expires_at`) | `id` | `created_by` -> `users(id)` | ✓ |
| 23 | `poll_votes` | 4 columns (`option_index`) | `(poll_id, user_id)` | Junction | ✓ |
| 24 | `reposts` | 4 columns (`content`) | `id` | `original_post_id` -> `posts(id)`, `reposter_id` | ✓ |
| 25 | `questions` | 9 columns (includes `is_resolved`) | `id` | `author_id` -> `users(id)` | ✓ |
| 26 | `question_answers` | 7 columns (`is_accepted`) | `id` | `question_id` -> `questions(id)`, `author_id` | ✓ |
| 27 | `resources` | 10 columns (`course_code`, `file_url`, `rating`) | `id` | `uploaded_by` -> `users(id)` | ✓ |
| 28 | `research_papers` | 9 columns (`abstract`, `doi`, `pdf_url`) | `id` | `uploaded_by` -> `users(id)` | ✓ |
| 29 | `marketplace_listings` | 10 columns (`price`, `condition`, `status`) | `id` | `posted_by` -> `users(id)` | ✓ |
| 30 | `skill_endorsements` | 4 columns | `(user_id, endorser_id, skill)` | Junction | ✓ |
| 31 | `portfolio_projects` | 7 columns (`title`, `url`, `image_url`) | `id` | `user_id` -> `users(id)` | ✓ |
| 32 | `portfolio_certifications` | 7 columns (`name`, `issuer`, `url`) | `id` | `user_id` -> `users(id)` | ✓ |
| 33 | `ads` | 12 columns (`budget`, `impressions`, `clicks`) | `id` | `created_by` -> `users(id)` | ✓ |
| 34 | `subscriptions` | 7 columns (`plan`, `status`) | `id` | `user_id` -> `users(id)` | ✓ |
| 35 | `presence` | 4 columns (`status`, `last_seen`) | `user_id` | `users(id)` | ✓ |
| 36 | `user_reputation` | 5 columns (`points`, `level`, `badges`) | `user_id` | `users(id)` | ✓ |
| 37 | `content_reports` | 9 columns (`target_type`, `reason`, `status`) | `id` | `reporter_id` -> `users(id)` | ✓ |
| 38 | `calls` | 9 columns (`caller_id`, `recipient_id`, `type`, `status`, `started_at`, `ended_at`) | `id` | `caller_id` -> `users(id)`, `recipient_id` -> `users(id)` | ✓ |

---

## 3. Detailed Verification of Phase 2 Schema Fixes

### 3.1 Table `calls` Addition
- **Migration Location:** `supabase/migrations/20240101000000_init.sql` (Lines 520–534).
- **Foreign Keys:** `calls_caller_id_fkey` and `calls_recipient_id_fkey` explicitly defined to enable Supabase join syntax:
  ```typescript
  .select("*, caller:users!calls_caller_id_fkey(...), recipient:users!calls_recipient_id_fkey(...)")
  ```
- **Indexes:** `idx_calls_caller`, `idx_calls_recipient`, `idx_calls_status`.
- **RLS Policies:**
  - `View own calls`: `auth.uid() = caller_id OR auth.uid() = recipient_id`
  - `Create calls`: `auth.uid() = caller_id`
  - `Update own calls`: `auth.uid() = caller_id OR auth.uid() = recipient_id`
- **Trigger:** `set_calls_updated_at` before update on `calls`.
- **Test Result:** Verified via `tests/phase2-foundation.test.ts`.

### 3.2 Column `questions.is_resolved` Addition
- **Migration Location:** `supabase/migrations/20240101000000_init.sql` (Line 348).
- **Column Definition:** `is_resolved BOOLEAN DEFAULT FALSE`.
- **Code Compatibility:** Fully unblocks `acceptAnswer()` in `src/server/db/content.ts:L141`.
- **Test Result:** Verified via `tests/phase2-foundation.test.ts`.

### 3.3 Column Alignment `jobs.type`
- **Code Location:** `src/server/db/events-jobs.ts:L54`.
- **Code Change:** Corrected query from `.eq("employment_type", filters.type)` to `.eq("type", filters.type)`.
- **Test Result:** Verified via `tests/phase2-foundation.test.ts`.
