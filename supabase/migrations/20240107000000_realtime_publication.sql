-- ============================================================================
-- No prior migration ever added any table to the supabase_realtime
-- publication, but three client hooks subscribe to `postgres_changes`
-- (which requires publication membership — unlike a pure `broadcast`
-- channel, which doesn't): useRealtimeNotifications.ts (notifications),
-- useRealtimeFeed.ts (posts), useRealtime.ts (messages). If Realtime has
-- been working for these, it's because someone enabled it by hand in the
-- Supabase dashboard, which isn't reproducible from source and won't
-- survive standing the project up from these migrations alone. Making it
-- explicit and idempotent so it is.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
