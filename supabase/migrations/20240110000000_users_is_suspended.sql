-- The admin/users moderation actions (make_admin/suspend/restore) wrote
-- 'admin'/'suspended' into users.role, which only allows
-- ('Student', 'Research Scholar', 'Faculty') — every such write violated
-- the CHECK constraint and failed silently (the route never checked the
-- update's error). is_admin already existed for the admin flag; suspension
-- had no column at all. Additive, defaulted, safe against existing rows.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
