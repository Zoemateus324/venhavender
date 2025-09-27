-- Allow anonymous (anon) role to read public data needed for the marketplace

-- Ads: allow anon to read only active ads
CREATE POLICY IF NOT EXISTS "Anon can read active ads" ON ads
  FOR SELECT TO anon
  USING (status = 'active');

-- Categories: allow anon to read
CREATE POLICY IF NOT EXISTS "Anon can read categories" ON categories
  FOR SELECT TO anon
  USING (true);

-- Plans: allow anon to read only active plans
CREATE POLICY IF NOT EXISTS "Anon can read active plans" ON plans
  FOR SELECT TO anon
  USING (active = true);

