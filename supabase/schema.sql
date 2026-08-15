-- ECOTRACK database schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL)

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active waste collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Aggregated site metrics (single row)
CREATE TABLE IF NOT EXISTS site_metrics (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_routes INT NOT NULL DEFAULT 0,
  active_collections INT NOT NULL DEFAULT 0,
  total_distance_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature cards for landing page
CREATE TABLE IF NOT EXISTS feature_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_type TEXT NOT NULL DEFAULT 'route',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'administrator' CHECK (role IN ('administrator', 'driver', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read for landing page stats and features
CREATE POLICY "Public read site_metrics" ON site_metrics FOR SELECT USING (true);
CREATE POLICY "Public read feature_cards" ON feature_cards FOR SELECT USING (true);
CREATE POLICY "Public read routes count" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read collections count" ON collections FOR SELECT USING (true);

-- Authenticated users can read profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Seed data
INSERT INTO routes (name, distance_km, status) VALUES
  ('Jasaan Central Route', 28.5, 'active'),
  ('Upper Jasaan Route', 22.1, 'active'),
  ('San Antonio Route', 31.0, 'active'),
  ('Aplaya Route', 18.4, 'active'),
  ('Solana Route', 26.8, 'active'),
  ('Macajalar Route', 25.6, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO collections (driver_name, status) VALUES
  ('Juan Dela Cruz', 'active'),
  ('Maria Santos', 'active'),
  ('Pedro Reyes', 'active'),
  ('Ana Garcia', 'active'),
  ('Carlos Mendoza', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO site_metrics (id, total_routes, active_collections, total_distance_km)
VALUES (1, 6, 5, 152.4)
ON CONFLICT (id) DO UPDATE SET
  total_routes = EXCLUDED.total_routes,
  active_collections = EXCLUDED.active_collections,
  total_distance_km = EXCLUDED.total_distance_km,
  updated_at = NOW();

INSERT INTO feature_cards (title, description, icon_type, sort_order) VALUES
  (
    'Route Management',
    'Plan and optimize waste collection routes across Jasaan. Assign drivers, set schedules, and monitor route performance in real time.',
    'route',
    1
  ),
  (
    'Collection Monitoring',
    'Track real-time collection activities, driver performance, and vehicle status. Ensure timely and efficient waste pickup across all barangays.',
    'collection',
    2
  ),
  (
    'Reporting & Analytics',
    'Generate comprehensive reports on collection efficiency, route coverage, and environmental impact. Make data-driven decisions for a cleaner community.',
    'analytics',
    3
  )
ON CONFLICT DO NOTHING;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'administrator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Dashboard tables
CREATE TABLE IF NOT EXISTS dashboard_kpis (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  todays_collection INT NOT NULL DEFAULT 1,
  total_barangay INT NOT NULL DEFAULT 15,
  total_complaint INT NOT NULL DEFAULT 10,
  waste_collected_kg DECIMAL(12, 2) NOT NULL DEFAULT 30670,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_date DATE NOT NULL UNIQUE,
  label TEXT NOT NULL,
  collections INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS collection_status_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  percentage INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#056636',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_label TEXT NOT NULL,
  date_label TEXT NOT NULL,
  barangay TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending')),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general' CHECK (
    announcement_type IN ('schedule', 'notice', 'general', 'guidelines')
  ),
  audience TEXT NOT NULL DEFAULT 'all_residents' CHECK (
    audience IN ('all_residents', 'barangay_residents', 'staff')
  ),
  publish_status TEXT NOT NULL DEFAULT 'publish_now' CHECK (
    publish_status IN ('scheduled', 'publish_now')
  ),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_status_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read dashboard_kpis" ON dashboard_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read collection_trends" ON collection_trends FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read collection_status_summary" ON collection_status_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read weekly_schedules" ON weekly_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update announcements" ON announcements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete announcements" ON announcements FOR DELETE TO authenticated USING (true);

INSERT INTO dashboard_kpis (id, todays_collection, total_barangay, total_complaint, waste_collected_kg)
VALUES (1, 1, 15, 10, 30670)
ON CONFLICT (id) DO UPDATE SET
  todays_collection = EXCLUDED.todays_collection,
  total_barangay = EXCLUDED.total_barangay,
  total_complaint = EXCLUDED.total_complaint,
  waste_collected_kg = EXCLUDED.waste_collected_kg,
  updated_at = NOW();

INSERT INTO collection_status_summary (status, label, count, percentage, color, sort_order) VALUES
  ('completed', 'Completed', 12, 67, '#056636', 1),
  ('in_progress', 'In Progress', 3, 17, '#3b82f6', 2),
  ('pending', 'Pending', 2, 11, '#eab308', 3),
  ('cancelled', 'Cancelled', 1, 5, '#ef4444', 4)
ON CONFLICT (status) DO NOTHING;

INSERT INTO weekly_schedules (day_label, date_label, barangay, status, sort_order) VALUES
  ('Mon', 'July 20', 'Upper Jasaan', 'completed', 1),
  ('Tue', 'July 21', 'Nahalinan', 'pending', 2),
  ('Wed', 'July 22', 'Lower Jasaan', 'pending', 3),
  ('Thu', 'July 23', 'Solana', 'pending', 4),
  ('Fri', 'July 24', 'Aplaya', 'pending', 5)
ON CONFLICT DO NOTHING;

INSERT INTO announcements (title, content) VALUES
  (
    'Schedule Update',
    'Collection schedule for July 21, 2026 in Nahalinan will start at 4:00 AM. Please prepare your waste accordingly.'
  ),
  (
    'Clean and Green Reminder',
    'Let''s work together for a cleaner Jasaan! Remember to segregate your waste and support our eco-friendly initiatives.'
  )
ON CONFLICT DO NOTHING;

-- Collection schedules (Schedules page CRUD)
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

CREATE POLICY "Auth read collection_schedules" ON collection_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert collection_schedules" ON collection_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update collection_schedules" ON collection_schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete collection_schedules" ON collection_schedules FOR DELETE TO authenticated USING (true);

INSERT INTO collection_schedules (barangay, collection_date, time_start, time_end, driver, status) VALUES
  ('Upper Jasaan', '2026-07-20', '04:00', '08:00', 'Juan', 'ongoing'),
  ('Nahalinan', '2026-07-21', '04:00', '08:00', 'Pedro', 'pending'),
  ('Lower Jasaan', '2026-07-22', '04:00', '08:00', 'Dexter', 'pending'),
  ('Solana', '2026-07-23', '04:00', '08:00', 'Nick', 'pending'),
  ('Aplaya', '2026-07-24', '04:00', '08:00', 'Jhon', 'pending'),
  ('Bubontogan', '2026-07-25', '04:00', '08:00', 'Dan', 'pending'),
  ('Maintenance', '2026-07-26', NULL, NULL, NULL, 'no_collection');

-- Barangays (Barangay page CRUD)
CREATE TABLE IF NOT EXISTS barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  population INT NOT NULL DEFAULT 0 CHECK (population >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

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

-- Complaints (Complaint page CRUD)
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

-- Generated reports (Reports page)
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (
    report_type IN ('collection', 'barangay', 'complaint', 'driver', 'route', 'user')
  ),
  period_label TEXT NOT NULL,
  generated_by TEXT NOT NULL DEFAULT 'Admin',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  barangay_filter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read generated_reports" ON generated_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert generated_reports" ON generated_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth delete generated_reports" ON generated_reports FOR DELETE TO authenticated USING (true);

INSERT INTO generated_reports (report_name, report_type, period_label, generated_by, generated_at, from_date, to_date) VALUES
  ('Collection Report', 'collection', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:30:00+08', '2026-07-01', '2026-07-31'),
  ('Barangay Collection Report', 'barangay', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:15:00+08', '2026-07-01', '2026-07-31'),
  ('Complaint Report', 'complaint', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:00:00+08', '2026-07-01', '2026-07-31'),
  ('Driver Performance Report', 'driver', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:45:00+08', '2026-07-01', '2026-07-31'),
  ('Route Report', 'route', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:30:00+08', '2026-07-01', '2026-07-31'),
  ('User Report', 'user', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:15:00+08', '2026-07-01', '2026-07-31')
ON CONFLICT DO NOTHING;
