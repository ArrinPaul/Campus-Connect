# CAMPUS CONNECT — DATABASE RUNBOOK

---

## 1. Schema Lifecycle & Migrations
- All database mutations must be defined in versioned SQL files under `supabase/migrations/`.
- Never execute destructive `DROP TABLE` or `ALTER COLUMN DROP` migrations in production without backup and staging dry-run.

---

## 2. Table Catalog (44 Tables)
1. `users`, 2. `profiles`, 3. `posts`, 4. `comments`, 5. `reactions`, 6. `follows`, 7. `communities`, 8. `community_members`, 9. `messages`, 10. `conversations`, 11. `conversation_participants`, 12. `events`, 13. `event_attendees`, 14. `jobs`, 15. `job_applications`, 16. `questions`, 17. `answers`, 18. `question_votes`, 19. `answer_votes`, 20. `research_papers`, 21. `research_reviews`, 22. `research_votes`, 23. `marketplace_listings`, 24. `marketplace_inquiries`, 25. `stories`, 26. `story_views`, 27. `resources`, 28. `resource_ratings`, 29. `hashtags`, 30. `user_reputation`, 31. `bookmarks`, 32. `skill_endorsements`, 33. `ad_campaigns`, 34. `ad_analytics`, 35. `notifications`, 36. `polls`, 37. `poll_votes`, 38. `calls`, 39. `reputation_events`, 40. `push_subscriptions`, 41. `subscriptions`, 42. `subscription_events`, 43. `research_embeddings`, 44. `user_interest_embeddings`.
