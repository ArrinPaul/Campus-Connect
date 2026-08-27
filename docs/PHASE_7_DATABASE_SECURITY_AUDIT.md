# CAMPUS CONNECT — PHASE 7 DATABASE & SUPABASE SECURITY AUDIT

**Audit Date:** August 27, 2026  
**Total Canonical Tables:** 44  
**RLS Status:** Enabled on 100% of user data tables  
**Audit Scope:** Verification of Primary Keys, Foreign Keys, Indexes, Constraints, and Row Level Security (RLS) Policies across all 44 tables.

---

## 1. Table-by-Table Security Matrix

| Table # | Table Name | PK | FK Constraints | Indexes | RLS Enabled | Policies |
|---|---|:---:|:---:|:---:|:---:|---|
| 1 | `users` | `id` | `auth.users(id)` ON DELETE CASCADE | `idx_users_university`, `idx_users_username` | ✅ | Read: Public; Update: Self |
| 2 | `profiles` | `id` | `users(id)` ON DELETE CASCADE | `idx_profiles_user` | ✅ | Read: Public; Mutate: Self |
| 3 | `posts` | `id` | `users(id)` ON DELETE CASCADE | `idx_posts_author`, `idx_posts_created` | ✅ | Read: Public; Mutate: Author |
| 4 | `comments` | `id` | `posts(id)`, `users(id)` | `idx_comments_post`, `idx_comments_parent` | ✅ | Read: Public; Mutate: Author |
| 5 | `reactions` | `id` | `users(id)` | `idx_reactions_target` | ✅ | Read: Public; Mutate: Actor |
| 6 | `follows` | `id` | `users(id)` (follower & target) | `idx_follows_follower_following` (UNIQUE) | ✅ | Read: Public; Mutate: Follower |
| 7 | `communities` | `id` | `users(id)` (creator) | `idx_communities_slug` | ✅ | Read: Public; Update: Admin/Creator |
| 8 | `community_members` | `id` | `communities(id)`, `users(id)` | `idx_comm_members_unique` | ✅ | Read: Public; Mutate: Member |
| 9 | `messages` | `id` | `conversations(id)`, `users(id)` | `idx_messages_conversation` | ✅ | Read/Write: Conversation Participants |
| 10 | `conversations` | `id` | - | `idx_conversations_created` | ✅ | Read/Write: Participants |
| 11 | `conversation_participants` | `id` | `conversations(id)`, `users(id)` | `idx_conv_parts_unique` | ✅ | Read/Write: Participants |
| 12 | `events` | `id` | `users(id)` (creator) | `idx_events_start_date` | ✅ | Read: Public; Mutate: Creator |
| 13 | `event_attendees` | `id` | `events(id)`, `users(id)` | `idx_event_attendees_unique` | ✅ | Read: Public; Mutate: Attendee |
| 14 | `jobs` | `id` | `users(id)` (poster) | `idx_jobs_created` | ✅ | Read: Public; Mutate: Poster |
| 15 | `job_applications` | `id` | `jobs(id)`, `users(id)` | `idx_job_apps_unique` | ✅ | Read: Applicant & Poster; Insert: Applicant |
| 16 | `questions` | `id` | `users(id)` | `idx_questions_created` | ✅ | Read: Public; Mutate: Author |
| 17 | `answers` | `id` | `questions(id)`, `users(id)` | `idx_answers_question` | ✅ | Read: Public; Mutate: Author |
| 18 | `question_votes` | `id` | `questions(id)`, `users(id)` | `idx_question_votes_unique` | ✅ | Read: Public; Mutate: Voter |
| 19 | `answer_votes` | `id` | `answers(id)`, `users(id)` | `idx_answer_votes_unique` | ✅ | Read: Public; Mutate: Voter |
| 20 | `research_papers` | `id` | `users(id)` (author) | `idx_research_created` | ✅ | Read: Public; Mutate: Author |
| 21 | `research_reviews` | `id` | `research_papers(id)`, `users(id)` | `idx_research_reviews_paper` | ✅ | Read: Public; Mutate: Reviewer |
| 22 | `research_votes` | `id` | `research_papers(id)`, `users(id)` | `idx_research_votes_unique` | ✅ | Read: Public; Mutate: Voter |
| 23 | `marketplace_listings` | `id` | `users(id)` (seller) | `idx_marketplace_created` | ✅ | Read: Public; Mutate: Seller |
| 24 | `marketplace_inquiries` | `id` | `marketplace_listings(id)`, `users(id)` | `idx_market_inq_listing` | ✅ | Read: Buyer & Seller; Insert: Buyer |
| 25 | `stories` | `id` | `users(id)` (author) | `idx_stories_created` | ✅ | Read: Public active; Mutate: Author |
| 26 | `story_views` | `id` | `stories(id)`, `users(id)` | `idx_story_views_unique` | ✅ | Read: Author; Insert: Viewer |
| 27 | `resources` | `id` | `users(id)` (uploader) | `idx_resources_created` | ✅ | Read: Public; Mutate: Uploader |
| 28 | `resource_ratings` | `id` | `resources(id)`, `users(id)` | `idx_resource_ratings_unique` | ✅ | Read: Public; Mutate: Rater |
| 29 | `hashtags` | `id` | - | `idx_hashtags_name` (UNIQUE) | ✅ | Read: Public; Write: System/User |
| 30 | `user_reputation` | `user_id` | `users(id)` ON DELETE CASCADE | `idx_user_reputation_points` | ✅ | Read: Public; Mutate: Service Role |
| 31 | `bookmarks` | `id` | `users(id)` | `idx_bookmarks_user_target` (UNIQUE) | ✅ | Read/Mutate: Owner |
| 32 | `skill_endorsements` | `id` | `users(id)` (target & endorser) | `idx_endorsements_unique` | ✅ | Read: Public; Mutate: Endorser |
| 33 | `ad_campaigns` | `id` | `users(id)` (advertiser) | `idx_ads_status` | ✅ | Read: Public active; Mutate: Advertiser/Admin |
| 34 | `ad_analytics` | `id` | `ad_campaigns(id)` | `idx_ad_analytics_campaign` | ✅ | Read: Advertiser/Admin; Insert: System |
| 35 | `notifications` | `id` | `users(id)` (recipient & sender) | `idx_notifications_user` | ✅ | Read/Update: Recipient; Insert: Service/User |
| 36 | `polls` | `id` | `posts(id)` | `idx_polls_post` | ✅ | Read: Public; Mutate: Author |
| 37 | `poll_votes` | `id` | `polls(id)`, `users(id)` | `idx_poll_votes_unique` | ✅ | Read: Public; Mutate: Voter |
| 38 | `calls` | `id` | `users(id)` (caller & recipient) | `idx_calls_participants` | ✅ | Read/Update: Caller & Recipient |
| 39 | `reputation_events` | `id` | `users(id)` (recipient & actor) | `idx_reputation_events_unique` | ✅ | Read: Public; Insert: Service Role |
| 40 | `push_subscriptions` | `id` | `users(id)` | `idx_push_subs_user` | ✅ | Read/Mutate: Owner |
| 41 | `subscriptions` | `id` | `users(id)` | `idx_subscriptions_user` | ✅ | Read: Owner; Mutate: Service Role |
| 42 | `subscription_events` | `id` | - | `idx_subscription_events_provider_id` | ✅ | Read/Write: Service Role |
| 43 | `research_embeddings` | `id` | `research_papers(id)` | `idx_research_embeddings_paper` | ✅ | Read: Public; Mutate: Service Role |
| 44 | `user_interest_embeddings` | `id` | `users(id)` | `idx_user_interest_embeddings_user` | ✅ | Read: Public; Mutate: Service Role |

---

## 2. Security Audit Conclusions
- Zero table without Primary Keys.
- Foreign Keys with appropriate `ON DELETE CASCADE` or `SET NULL` on all user relationships.
- RLS enabled on 100% of tables.
- Mutation endpoints enforced via server-side session checks in Next.js API layer.
