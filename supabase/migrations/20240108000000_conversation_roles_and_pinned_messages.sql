-- GroupInfoPanel (src/components/messages/GroupInfoPanel.tsx) has fully
-- built admin-promotion and pinned-messages UI, but conversation_participants
-- has no role column and messages has no pinned flag — those API routes
-- (api/conversations/admin, api/conversations/pinned) were 404s until this
-- migration lands. Both changes are additive and nullable/defaulted, safe
-- against existing rows.

ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member'));

-- Backfill: whoever created the conversation becomes its owner. Only affects
-- rows still at the new column's default, so re-running this migration is
-- safe and won't clobber a role someone already changed.
UPDATE conversation_participants cp
SET role = 'owner'
FROM conversations c
WHERE c.id = cp.conversation_id
  AND c.created_by = cp.user_id
  AND cp.role = 'member';

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz;
