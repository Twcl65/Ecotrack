-- Barangays table (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  population INT NOT NULL DEFAULT 0 CHECK (population >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read barangays" ON barangays;
DROP POLICY IF EXISTS "Auth insert barangays" ON barangays;
DROP POLICY IF EXISTS "Auth update barangays" ON barangays;
DROP POLICY IF EXISTS "Auth delete barangays" ON barangays;

CREATE POLICY "Auth read barangays" ON barangays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert barangays" ON barangays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update barangays" ON barangays FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete barangays" ON barangays FOR DELETE TO authenticated USING (true);

INSERT INTO barangays (name, population, status) VALUES
  ('Upper Jasaan', 2670, 'active'),
  ('Nahalinan', 1845, 'active'),
  ('Lower Jasaan', 2230, 'active'),
  ('Solana', 1980, 'active'),
  ('Aplaya', 2150, 'active'),
  ('Bubontogan', 1720, 'active'),
  ('San Antonio', 2410, 'active')
ON CONFLICT (name) DO NOTHING;
