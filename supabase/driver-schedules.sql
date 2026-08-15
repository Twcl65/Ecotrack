-- Driver schedules & related seed data
-- Run in Supabase SQL Editor after schedules.sql, users.sql, and routes.sql
--
-- Aligns collection_schedules.driver with routes.driver_name and system_users.
-- Primary demo driver: Juan Dela Cruz (Upper Jasaan Route R-001)

-- ---------------------------------------------------------------------------
-- 1. Driver accounts (directory rows — create matching Auth user via dashboard)
-- ---------------------------------------------------------------------------
INSERT INTO system_users (user_code, first_name, middle_name, last_name, email, phone, role, username, status, last_login_at, created_at) VALUES
  ('USR-2025-0029', 'Juan', NULL, 'Dela Cruz', 'juan.driver@ecotrack.com', '09123456780', 'driver', 'juan.driver', 'active', NOW(), NOW()),
  ('USR-2025-0030', 'Maria', NULL, 'Santos', 'maria.driver@ecotrack.com', '09171234560', 'driver', 'maria.driver', 'active', NOW(), NOW()),
  ('USR-2025-0031', 'Rosa', NULL, 'Villanueva', 'rosa.villanueva@ecotrack.com', '09181234560', 'driver', 'rosa.driver', 'active', NULL, NOW())
ON CONFLICT (user_code) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  status = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- 2. Normalize legacy short driver names
-- ---------------------------------------------------------------------------
UPDATE collection_schedules SET driver = 'Juan Dela Cruz'   WHERE driver IN ('Juan', 'Juan M Dela Cruz');
UPDATE collection_schedules SET driver = 'Pedro Reyes'      WHERE driver IN ('Pedro', 'Dexter');
UPDATE collection_schedules SET driver = 'Maria Santos'       WHERE driver IN ('Maria');
UPDATE collection_schedules SET driver = 'Ana Garcia'         WHERE driver IN ('Ana', 'Nick');
UPDATE collection_schedules SET driver = 'Carlos Mendoza'     WHERE driver IN ('Carlos', 'Jhon', 'Dan');

-- ---------------------------------------------------------------------------
-- 3. Replace August 2026 demo week (avoids duplicate rows on re-run)
-- ---------------------------------------------------------------------------
DELETE FROM collection_schedules
WHERE collection_date BETWEEN '2026-08-11' AND '2026-08-22'
  AND barangay <> 'Maintenance';

-- Juan Dela Cruz — matches driver app mockups (multiple stops per day)
INSERT INTO collection_schedules (barangay, collection_date, time_start, time_end, driver, status) VALUES
  ('Upper Jasaan',  '2026-08-11', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Nahalinan',     '2026-08-12', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Nahalinan',     '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'completed'),
  ('Lower Jasaan',  '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Solana',        '2026-08-13', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Upper Jasaan',  '2026-08-14', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Aplaya',        '2026-08-14', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Bubontogan',    '2026-08-15', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('San Antonio',   '2026-08-16', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Bobuntugan',    '2026-08-18', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Kimaya',        '2026-08-19', '04:00', '09:00', 'Juan Dela Cruz', 'pending'),
  ('Old Jasaan',    '2026-08-20', '04:00', '09:00', 'Juan Dela Cruz', 'pending');

-- Other assigned drivers (route-aligned)
INSERT INTO collection_schedules (barangay, collection_date, time_start, time_end, driver, status) VALUES
  ('San Antonio',   '2026-08-12', '04:00', '09:00', 'Maria Santos',   'completed'),
  ('Macajalar',     '2026-08-13', '04:00', '09:00', 'Maria Santos',   'ongoing'),
  ('San Antonio',   '2026-08-15', '04:00', '09:00', 'Maria Santos',   'pending'),
  ('Solana',        '2026-08-12', '04:00', '09:00', 'Pedro Reyes',    'completed'),
  ('Bubontogan',    '2026-08-14', '04:00', '09:00', 'Pedro Reyes',    'pending'),
  ('Solana',        '2026-08-17', '04:00', '09:00', 'Pedro Reyes',    'pending'),
  ('Aplaya',        '2026-08-11', '04:00', '09:00', 'Ana Garcia',     'completed'),
  ('Lower Jasaan',  '2026-08-16', '04:00', '09:00', 'Ana Garcia',     'pending'),
  ('Aplaya',        '2026-08-18', '04:00', '09:00', 'Ana Garcia',     'pending'),
  ('Lower Jasaan',  '2026-08-12', '04:00', '09:00', 'Carlos Mendoza', 'completed'),
  ('Upper Jasaan',  '2026-08-17', '04:00', '09:00', 'Carlos Mendoza', 'pending'),
  ('Maintenance',   '2026-08-22', NULL,    NULL,    NULL,             'no_collection');

-- ---------------------------------------------------------------------------
-- 4. Driver-relevant announcements
-- ---------------------------------------------------------------------------
INSERT INTO announcements (
  title, subtitle, content, announcement_type, audience, publish_status,
  published_at, expires_at, views, created_at, updated_at
) VALUES
  (
    'Schedule Update: Nahalinan moved to 7:00 AM',
    'Collection Schedule Update',
    'Due to road maintenance in Solana, collection in Nahalinan will start at 7:00 AM instead of 4:00 AM on August 13, 2026. Please follow the updated route assigned by the admin.',
    'schedule', 'staff', 'publish_now',
    '2026-08-13 06:00:00+08', '2026-08-14 23:59:00+08', 12,
    NOW(), NOW()
  ),
  (
    'No Collection on August 22, 2026',
    'Holiday Notice',
    'There will be no waste collection on August 22, 2026 due to scheduled vehicle maintenance. Regular collection resumes August 23.',
    'notice', 'staff', 'publish_now',
    '2026-08-12 09:00:00+08', '2026-08-22 23:59:00+08', 8,
    NOW(), NOW()
  ),
  (
    'Segregate Waste Properly',
    'New Guidelines',
    'Drivers and staff are reminded to ensure residents segregate biodegradable, recyclable, and residual waste before collection.',
    'guidelines', 'staff', 'publish_now',
    '2026-08-10 11:00:00+08', '2026-12-31 23:59:00+08', 24,
    NOW(), NOW()
  ),
  (
    'Clean and Green Jasaan',
    'General',
    'Let''s keep Jasaan clean! Thank you for your dedication on daily collection routes.',
    'general', 'staff', 'publish_now',
    '2026-08-11 08:00:00+08', '2026-12-31 23:59:00+08', 15,
    NOW(), NOW()
  );

-- ---------------------------------------------------------------------------
-- 5. Ensure route driver names match schedule drivers
-- ---------------------------------------------------------------------------
UPDATE routes SET driver_name = 'Juan Dela Cruz'   WHERE route_code = 'R-001' OR name = 'Upper Jasaan Route';
UPDATE routes SET driver_name = 'Maria Santos'   WHERE route_code = 'R-002' OR name = 'San Antonio Route';
UPDATE routes SET driver_name = 'Pedro Reyes'    WHERE route_code = 'R-003' OR name = 'Solana Route';
UPDATE routes SET driver_name = 'Ana Garcia'     WHERE route_code = 'R-004' OR name = 'Aplaya Route';
UPDATE routes SET driver_name = 'Carlos Mendoza' WHERE route_code = 'R-005' OR name = 'Jasaan Central Route';
UPDATE routes SET driver_name = 'Rosa Villanueva' WHERE route_code = 'R-006' OR name = 'Macajalar Route';
