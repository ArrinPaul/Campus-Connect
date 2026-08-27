-- ============================================================================
-- CAMPUS CONNECT — GAMIFICATION & REPUTATION EVENTS MIGRATION
-- ============================================================================

-- Create reputation_events table for auditable point history & period leaderboards
CREATE TABLE IF NOT EXISTS reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('accepted_answer', 'question_upvote', 'research_vote', 'helpful_review')),
  source_type TEXT NOT NULL CHECK (source_type IN ('question_answer', 'question', 'research_paper', 'research_review')),
  source_id UUID NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipient_user_id, event_type, source_id)
);

-- Index for weekly & monthly leaderboard range queries
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_recipient ON reputation_events(recipient_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_source ON reputation_events(event_type, source_id);

-- Index for user_reputation points ranking
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON user_reputation(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_user_skill ON skill_endorsements(user_id, skill);

-- Enable RLS
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read reputation events" ON reputation_events FOR SELECT USING (true);
CREATE POLICY "Service insert reputation events" ON reputation_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Service delete reputation events" ON reputation_events FOR DELETE USING (auth.role() = 'authenticated');
