-- Collection schedules (run in Supabase SQL Editor if not using full schema.sql)

CREATE TABLE IF NOT EXISTS collection_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay TEXT NOT NULL,
  collection_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  driver TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('ongoing', 'pending', 'completed', 'canceled', 'no_collection', 'maintenance')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE collection_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read collection_schedules" ON collection_schedules;
DROP POLICY IF EXISTS "Auth insert collection_schedules" ON collection_schedules;
DROP POLICY IF EXISTS "Auth update collection_schedules" ON collection_schedules;
DROP POLICY IF EXISTS "Auth delete collection_schedules" ON collection_schedules;

CREATE POLICY "Auth read collection_schedules"
  ON collection_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert collection_schedules"
  ON collection_schedules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update collection_schedules"
  ON collection_schedules FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete collection_schedules"
  ON collection_schedules FOR DELETE TO authenticated USING (true);

INSERT INTO collection_schedules (barangay, collection_date, time_start, time_end, driver, status) VALUES
  ('Upper Jasaan', '2026-07-20', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Nahalinan', '2026-07-21', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Lower Jasaan', '2026-07-22', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Solana', '2026-07-23', '04:00', '09:00', 'Pedro Reyes', 'pending'),
  ('Aplaya', '2026-07-24', '04:00', '09:00', 'Ana Garcia', 'pending'),
  ('Bubontogan', '2026-07-25', '04:00', '09:00', 'Carlos Mendoza', 'pending'),
  ('Maintenance', '2026-07-26', NULL, NULL, NULL, 'no_collection')
ON CONFLICT DO NOTHING;
