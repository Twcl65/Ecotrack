-- System users for User Management page (run in Supabase SQL Editor)
-- Passwords are stored in Supabase Auth (auth.users), not in this table.
-- Users created via "Add New User" share the same id as their auth account.
-- Seed rows below are directory/demo data only — they cannot sign in until
-- you add them through the dashboard (or create matching auth users manually).

CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'driver', 'resident')),
  username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read system_users" ON system_users;
DROP POLICY IF EXISTS "Auth insert system_users" ON system_users;
DROP POLICY IF EXISTS "Auth update system_users" ON system_users;
DROP POLICY IF EXISTS "Auth delete system_users" ON system_users;

CREATE POLICY "Auth read system_users" ON system_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert system_users" ON system_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update system_users" ON system_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete system_users" ON system_users FOR DELETE TO authenticated USING (true);

INSERT INTO system_users (user_code, first_name, middle_name, last_name, email, phone, role, username, status, last_login_at, created_at) VALUES
  ('USR-2025-0028', 'Juan', 'M', 'Dela Cruz', 'juan.delacruz@ecotrack.com', '09123456789', 'admin', 'juan.admin', 'active', '2026-05-26 10:05:00+08', '2025-04-15 09:15:00+08'),
  ('USR-2025-0027', 'Maria', NULL, 'Santos', 'maria.santos@ecotrack.com', '09171234567', 'admin', 'maria.admin', 'active', '2026-05-25 08:30:00+08', '2025-05-01 10:00:00+08'),
  ('USR-2025-0026', 'Pedro', 'R', 'Reyes', 'pedro.reyes@ecotrack.com', '09181234567', 'driver', 'pedro.driver', 'active', '2026-05-26 06:00:00+08', '2025-06-10 07:45:00+08'),
  ('USR-2025-0025', 'Ana', NULL, 'Garcia', 'ana.garcia@ecotrack.com', '09191234567', 'driver', 'ana.driver', 'active', '2026-05-24 14:20:00+08', '2025-06-15 11:30:00+08'),
  ('USR-2025-0024', 'Carlos', 'L', 'Mendoza', 'carlos.mendoza@ecotrack.com', '09201234567', 'driver', 'carlos.driver', 'active', '2026-05-23 05:45:00+08', '2025-07-01 09:00:00+08'),
  ('USR-2025-0023', 'Nhea', NULL, 'Ting', 'nhea.ting@gmail.com', '09121382526', 'resident', 'nhea.ting', 'active', '2026-05-20 19:00:00+08', '2025-08-01 16:00:00+08'),
  ('USR-2025-0022', 'Anna', 'B', 'Anton', 'anna.anton@gmail.com', '09171234568', 'resident', 'anna.anton', 'active', '2026-05-18 12:00:00+08', '2025-08-05 13:20:00+08'),
  ('USR-2025-0021', 'Sheena', NULL, 'Lim', 'sheena.lim@gmail.com', '09181234568', 'resident', 'sheena.lim', 'active', NULL, '2025-08-10 10:15:00+08'),
  ('USR-2025-0020', 'Aiza', 'M', 'Kim', 'aiza.kim@gmail.com', '09191234568', 'resident', 'aiza.kim', 'active', '2026-05-15 08:00:00+08', '2025-08-12 09:30:00+08'),
  ('USR-2025-0019', 'Mark', NULL, 'Villanueva', 'mark.v@gmail.com', '09201234568', 'resident', 'mark.v', 'active', '2026-05-10 21:00:00+08', '2025-09-01 14:00:00+08'),
  ('USR-2025-0018', 'Joy', 'C', 'Tan', 'joy.tan@gmail.com', '09211234568', 'resident', 'joy.tan', 'active', NULL, '2025-09-15 08:45:00+08'),
  ('USR-2025-0017', 'Ryan', NULL, 'Go', 'ryan.go@gmail.com', '09221234568', 'resident', 'ryan.go', 'active', '2026-05-22 07:30:00+08', '2025-10-01 11:00:00+08'),
  ('USR-2025-0016', 'Liza', 'P', 'Cruz', 'liza.cruz@gmail.com', '09231234568', 'resident', 'liza.cruz', 'active', '2026-05-19 18:00:00+08', '2025-10-20 15:30:00+08'),
  ('USR-2025-0015', 'John', NULL, 'Doe', 'john.doe@gmail.com', '09241234568', 'resident', 'john.doe', 'active', NULL, '2025-11-01 09:00:00+08'),
  ('USR-2025-0014', 'Grace', 'A', 'Lee', 'grace.lee@gmail.com', '09251234568', 'resident', 'grace.lee', 'active', '2026-05-21 10:00:00+08', '2025-11-15 10:45:00+08'),
  ('USR-2025-0013', 'Paul', NULL, 'Ng', 'paul.ng@gmail.com', '09261234568', 'resident', 'paul.ng', 'active', NULL, '2025-12-01 08:00:00+08'),
  ('USR-2025-0012', 'Cathy', 'R', 'Ong', 'cathy.ong@gmail.com', '09271234568', 'resident', 'cathy.ong', 'active', '2026-05-17 16:00:00+08', '2025-12-10 12:00:00+08'),
  ('USR-2025-0011', 'Dennis', NULL, 'Yu', 'dennis.yu@gmail.com', '09281234568', 'resident', 'dennis.yu', 'active', NULL, '2026-01-05 09:30:00+08'),
  ('USR-2025-0010', 'Ella', 'S', 'Wong', 'ella.wong@gmail.com', '09291234568', 'resident', 'ella.wong', 'active', '2026-05-14 20:00:00+08', '2026-01-20 14:15:00+08'),
  ('USR-2025-0009', 'Frank', NULL, 'Chua', 'frank.chua@gmail.com', '09301234568', 'resident', 'frank.chua', 'active', NULL, '2026-02-01 11:00:00+08'),
  ('USR-2025-0008', 'Gina', 'T', 'Ramos', 'gina.ramos@gmail.com', '09311234568', 'resident', 'gina.ramos', 'active', '2026-05-12 09:00:00+08', '2026-02-14 16:30:00+08'),
  ('USR-2025-0007', 'Henry', NULL, 'Sy', 'henry.sy@gmail.com', '09321234568', 'resident', 'henry.sy', 'inactive', NULL, '2026-03-01 08:00:00+08'),
  ('USR-2025-0006', 'Ivy', 'L', 'Chan', 'ivy.chan@gmail.com', '09331234568', 'resident', 'ivy.chan', 'inactive', NULL, '2026-03-15 10:00:00+08'),
  ('USR-2025-0005', 'Kevin', NULL, 'Torres', 'kevin.torres@gmail.com', '09341234568', 'resident', 'kevin.torres', 'active', '2026-05-11 13:00:00+08', '2026-04-01 09:00:00+08'),
  ('USR-2025-0004', 'Laura', 'M', 'Flores', 'laura.flores@gmail.com', '09351234568', 'resident', 'laura.flores', 'active', NULL, '2026-04-10 11:30:00+08'),
  ('USR-2025-0003', 'Miguel', NULL, 'Castro', 'miguel.castro@gmail.com', '09361234568', 'resident', 'miguel.castro', 'active', '2026-05-09 08:00:00+08', '2026-04-20 15:00:00+08'),
  ('USR-2025-0002', 'Nina', 'D', 'Aquino', 'nina.aquino@gmail.com', '09371234568', 'resident', 'nina.aquino', 'active', NULL, '2026-05-01 10:00:00+08'),
  ('USR-2025-0001', 'Oscar', NULL, 'Bautista', 'oscar.bautista@gmail.com', '09381234568', 'resident', 'oscar.bautista', 'active', '2026-05-08 17:00:00+08', '2026-05-10 08:30:00+08')
ON CONFLICT (user_code) DO NOTHING;
