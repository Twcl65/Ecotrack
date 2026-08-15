-- Current-week collection schedules (run in Supabase SQL Editor)
-- Prefer supabase/driver-schedules.sql for full driver demo data.

INSERT INTO collection_schedules (barangay, collection_date, time_start, time_end, driver, status) VALUES
  ('Upper Jasaan', '2026-08-11', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Nahalinan', '2026-08-12', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Nahalinan', '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Lower Jasaan', '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Solana', '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Macajalar', '2026-08-13', '04:00', '09:00', 'Maria Santos', 'ongoing'),
  ('Solana', '2026-08-14', '04:00', '09:00', 'Pedro Reyes', 'pending'),
  ('San Antonio', '2026-08-16', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Aplaya', '2026-08-18', '04:00', '09:00', 'Ana Garcia', 'pending');
