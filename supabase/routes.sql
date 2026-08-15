-- Route Management schema (run in Supabase SQL Editor)

ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_code TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS barangay TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS estimated_minutes INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('start', 'pending', 'completed', 'end')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route_id, stop_order)
);

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read route_stops" ON route_stops;
DROP POLICY IF EXISTS "Auth read route_stops" ON route_stops;
DROP POLICY IF EXISTS "Auth insert route_stops" ON route_stops;
DROP POLICY IF EXISTS "Auth update route_stops" ON route_stops;
DROP POLICY IF EXISTS "Auth delete route_stops" ON route_stops;

CREATE POLICY "Public read route_stops" ON route_stops FOR SELECT USING (true);
CREATE POLICY "Auth insert route_stops" ON route_stops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update route_stops" ON route_stops FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete route_stops" ON route_stops FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth insert routes" ON routes;
DROP POLICY IF EXISTS "Auth update routes" ON routes;
DROP POLICY IF EXISTS "Auth delete routes" ON routes;

CREATE POLICY "Auth insert routes" ON routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update routes" ON routes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete routes" ON routes FOR DELETE TO authenticated USING (true);

-- Enrich existing routes (match mockup-style data)
UPDATE routes SET
  route_code = 'R-001',
  barangay = 'Upper Jasaan, Nahalinan',
  area = 'Upper Jasaan',
  driver_name = 'Juan Dela Cruz',
  vehicle_id = 'VEH-001',
  estimated_minutes = 205,
  distance_km = 28.6
WHERE name = 'Upper Jasaan Route';

UPDATE routes SET
  route_code = 'R-002',
  barangay = 'San Antonio, Macajalar',
  area = 'San Antonio',
  driver_name = 'Maria Santos',
  vehicle_id = 'VEH-002',
  estimated_minutes = 240,
  distance_km = 31.0
WHERE name = 'San Antonio Route';

UPDATE routes SET
  route_code = 'R-003',
  barangay = 'Solana, Bubontogan',
  area = 'Solana',
  driver_name = 'Pedro Reyes',
  vehicle_id = 'VEH-003',
  estimated_minutes = 195,
  distance_km = 26.8
WHERE name = 'Solana Route';

UPDATE routes SET
  route_code = 'R-004',
  barangay = 'Aplaya, Lower Jasaan',
  area = 'Aplaya',
  driver_name = 'Ana Garcia',
  vehicle_id = 'VEH-004',
  estimated_minutes = 150,
  distance_km = 18.4
WHERE name = 'Aplaya Route';

UPDATE routes SET
  route_code = 'R-005',
  barangay = 'Jasaan Central, Lower Jasaan',
  area = 'Jasaan Central',
  driver_name = 'Carlos Mendoza',
  vehicle_id = 'VEH-005',
  estimated_minutes = 210,
  distance_km = 28.5
WHERE name = 'Jasaan Central Route';

UPDATE routes SET
  route_code = 'R-006',
  barangay = 'Macajalar, Nahalinan',
  area = 'Macajalar',
  driver_name = 'Rosa Villanueva',
  vehicle_id = 'VEH-006',
  estimated_minutes = 190,
  distance_km = 25.6,
  status = 'inactive'
WHERE name = 'Macajalar Route';

-- Route stops for Upper Jasaan (R-001) — Jasaan, Misamis Oriental area
INSERT INTO route_stops (route_id, stop_order, name, description, latitude, longitude, status)
SELECT r.id, s.stop_order, s.name, s.description, s.latitude, s.longitude, s.status
FROM routes r
CROSS JOIN (
  VALUES
    (1, 'Upper Jasaan Barangay Hall', 'Start point', 8.65480, 124.75420, 'start'),
    (2, 'Purok 1, Upper Jasaan', 'Residential Area', 8.65560, 124.75580, 'pending'),
    (3, 'Purok 2, Upper Jasaan', 'Residential Area', 8.65640, 124.75720, 'pending'),
    (4, 'Upper Jasaan Market', 'Commercial Area', 8.65710, 124.75850, 'pending'),
    (5, 'Nahalinan Crossing', 'Intersection', 8.65230, 124.75980, 'pending'),
    (6, 'Nahalinan Elementary', 'School Zone', 8.65100, 124.76120, 'pending'),
    (7, 'Purok 3, Nahalinan', 'Residential Area', 8.64980, 124.76250, 'pending'),
    (8, 'Nahalinan Chapel', 'Community Area', 8.64850, 124.76380, 'pending'),
    (9, 'Nahalinan Health Center', 'Public Facility', 8.64720, 124.76500, 'pending'),
    (10, 'Purok 4, Nahalinan', 'Residential Area', 8.64600, 124.76620, 'pending'),
    (11, 'Nahalinan Plaza', 'Public Area', 8.64480, 124.76750, 'pending'),
    (12, 'Nahalinan Public Market', 'End point', 8.64350, 124.76880, 'end')
) AS s(stop_order, name, description, latitude, longitude, status)
WHERE r.name = 'Upper Jasaan Route'
ON CONFLICT (route_id, stop_order) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  status = EXCLUDED.status;

-- Generic stops for other routes (barangay centers)
INSERT INTO route_stops (route_id, stop_order, name, description, latitude, longitude, status)
SELECT r.id, s.stop_order, s.name, s.description, s.latitude, s.longitude, s.status
FROM routes r
JOIN (
  VALUES
    ('San Antonio Route', 1, 'San Antonio Barangay Hall', 'Start point', 8.66100, 124.74800, 'start'),
    ('San Antonio Route', 2, 'Purok 1, San Antonio', 'Residential Area', 8.66200, 124.74950, 'pending'),
    ('San Antonio Route', 3, 'Macajalar Junction', 'Intersection', 8.64000, 124.75200, 'end'),
    ('Solana Route', 1, 'Solana Barangay Hall', 'Start point', 8.65800, 124.75100, 'start'),
    ('Solana Route', 2, 'Bubontogan Road', 'Residential Area', 8.65000, 124.74900, 'end'),
    ('Aplaya Route', 1, 'Aplaya Barangay Hall', 'Start point', 8.63500, 124.76000, 'start'),
    ('Aplaya Route', 2, 'Coastal Road', 'Coastal Area', 8.63300, 124.76200, 'end'),
    ('Jasaan Central Route', 1, 'Jasaan Municipal Hall', 'Start point', 8.65300, 124.75300, 'start'),
    ('Jasaan Central Route', 2, 'Lower Jasaan Center', 'Residential Area', 8.65100, 124.75600, 'end'),
    ('Macajalar Route', 1, 'Macajalar Barangay Hall', 'Start point', 8.63800, 124.75000, 'start'),
    ('Macajalar Route', 2, 'Macajalar Industrial', 'Industrial Area', 8.63600, 124.75300, 'end')
) AS s(route_name, stop_order, name, description, latitude, longitude, status)
  ON r.name = s.route_name
ON CONFLICT (route_id, stop_order) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  status = EXCLUDED.status;

-- Link collections to routes
UPDATE collections c SET route_id = r.id
FROM routes r
WHERE c.driver_name = r.driver_name AND c.route_id IS NULL;
