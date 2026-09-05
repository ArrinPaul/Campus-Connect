-- ============================================================================
-- The "Insert notifications" policy (init.sql) was declared as
-- `WITH CHECK (true)` — its own comment says "server can insert", but
-- `true` doesn't actually restrict inserts to the server at all; any
-- authenticated client calling supabase.from('notifications').insert(...)
-- directly (e.g. from browser dev tools with their own session) could
-- create a notification for any other user, unrelated to what actually
-- happened.
--
-- Every real notification insert in the app (createNotification, src/
-- server/db/notifications.ts) already goes through createAdminClient(),
-- which uses the service-role key and bypasses RLS entirely — so RLS on
-- this table was never actually gating the app's own writes, only
-- (failing to gate) a malicious direct client. Locking inserts to
-- `false` closes that gap with zero effect on legitimate traffic, since
-- none of it goes through RLS-checked inserts in the first place.
-- ============================================================================

ALTER POLICY "Insert notifications" ON notifications WITH CHECK (false);
