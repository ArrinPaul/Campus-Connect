-- The resource detail page has a 5-star rating widget and shows an average,
-- but neither a ratings table nor an api/resources/rate route existed.
CREATE TABLE IF NOT EXISTS resource_ratings (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (resource_id, user_id)
);

ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings are public" ON resource_ratings FOR SELECT USING (true);
CREATE POLICY "Rate as yourself" ON resource_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Change own rating" ON resource_ratings FOR UPDATE USING (auth.uid() = user_id);
