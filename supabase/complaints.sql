-- Complaints table (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_code TEXT NOT NULL UNIQUE,
  complainant_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  barangay TEXT NOT NULL,
  issue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'resolved', 'declined')
  ),
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read complaints" ON complaints;
DROP POLICY IF EXISTS "Auth insert complaints" ON complaints;
DROP POLICY IF EXISTS "Auth update complaints" ON complaints;
DROP POLICY IF EXISTS "Auth delete complaints" ON complaints;

CREATE POLICY "Auth read complaints" ON complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert complaints" ON complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update complaints" ON complaints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete complaints" ON complaints FOR DELETE TO authenticated USING (true);

INSERT INTO complaints (complaint_code, complainant_name, phone, barangay, issue, status, filed_at) VALUES
  ('CMP-01', 'Nhea Ting', '09121382526', 'Jampason', 'Pili ra ilang ga kuhaon', 'pending', '2026-06-20 09:30:00+08'),
  ('CMP-02', 'Anna Anton', '09171234567', 'Nahalinan', 'Ge labyan ra nila amoa', 'in_progress', '2026-07-09 14:15:00+08'),
  ('CMP-03', 'Sheena', '09181234567', 'Solana', 'Garbage overflowing', 'pending', '2026-07-01 10:00:00+08'),
  ('CMP-04', 'Aiza Mae', '09191234567', 'Kimaya', 'Missed collection', 'resolved', '2026-07-01 08:45:00+08'),
  ('CMP-05', 'Marco Reyes', '09201234567', 'Upper Jasaan', 'Late collection schedule', 'pending', '2026-08-01 11:20:00+08'),
  ('CMP-06', 'Liza Cruz', '09211234567', 'Lower Jasaan', 'Uncollected waste for 3 days', 'in_progress', '2026-08-03 16:30:00+08'),
  ('CMP-07', 'Ryan Santos', '09221234567', 'Aplaya', 'Damaged collection bin', 'resolved', '2026-08-05 09:00:00+08'),
  ('CMP-08', 'Grace Lim', '09231234567', 'Bubontogan', 'Noise during early collection', 'declined', '2026-08-06 07:15:00+08'),
  ('CMP-09', 'John Dela Cruz', '09241234567', 'San Antonio', 'Mixed waste not segregated', 'in_progress', '2026-08-08 13:45:00+08'),
  ('CMP-10', 'Maria Gomez', '09251234567', 'Nahalinan', 'Collection truck blocked road', 'pending', '2026-08-10 06:50:00+08'),
  ('CMP-11', 'Pedro Villa', '09261234567', 'Solana', 'Foul odor from uncollected trash', 'resolved', '2026-08-11 15:00:00+08'),
  ('CMP-12', 'Cathy Tan', '09271234567', 'Jampason', 'Wrong barangay visited', 'declined', '2026-08-11 18:30:00+08')
ON CONFLICT (complaint_code) DO NOTHING;
