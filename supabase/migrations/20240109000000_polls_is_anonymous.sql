-- PostComposer's poll creator lets the author mark a poll anonymous
-- (pollIsAnonymous state, forwarded as isAnonymous in the createPoll
-- mutation body), but polls has no column for it — the field was being
-- silently dropped. Additive, nullable-free with a safe default.
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
