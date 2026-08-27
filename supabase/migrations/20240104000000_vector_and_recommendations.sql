-- ============================================================================
-- CAMPUS CONNECT — PHASE 7 MIGRATION: VECTOR EMBEDDINGS & RECOMMENDATIONS
-- ============================================================================

-- 43. RESEARCH EMBEDDINGS
CREATE TABLE IF NOT EXISTS research_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  embedding JSONB DEFAULT '[]',
  dimensions INT DEFAULT 128,
  model TEXT DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paper_id)
);

CREATE INDEX IF NOT EXISTS idx_research_embeddings_paper ON research_embeddings(paper_id);

ALTER TABLE research_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read research embeddings"
  ON research_embeddings FOR SELECT
  USING (true);

-- 44. USER INTEREST EMBEDDINGS
CREATE TABLE IF NOT EXISTS user_interest_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  dimensions INT DEFAULT 128,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interest_embeddings_user ON user_interest_embeddings(user_id);

ALTER TABLE user_interest_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user interest embeddings"
  ON user_interest_embeddings FOR SELECT
  USING (true);
