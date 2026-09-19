-- The marketplace detail page has a full purchase-request flow (buyer sends a
-- request, seller accepts/declines) wired to api/marketplace/{purchase,
-- complete,cancel,transactions}, but no table or routes existed. This is a
-- request/offer record, not a payment: no money moves through the app.
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (buyer_id <> seller_id)
);

-- One open request per buyer per listing
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_transactions_one_pending
  ON marketplace_transactions (listing_id, buyer_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS marketplace_transactions_listing_idx ON marketplace_transactions (listing_id);

ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read transactions" ON marketplace_transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers create requests" ON marketplace_transactions
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update transactions" ON marketplace_transactions
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER set_marketplace_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
