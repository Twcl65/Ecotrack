-- Announcements table + admin page (run in Supabase SQL Editor)

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

-- If table already existed with only title/content, add missing columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS announcement_type TEXT NOT NULL DEFAULT 'general';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all_residents';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS publish_status TEXT NOT NULL DEFAULT 'publish_now';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read announcements" ON announcements;
DROP POLICY IF EXISTS "Auth insert announcements" ON announcements;
DROP POLICY IF EXISTS "Auth update announcements" ON announcements;
DROP POLICY IF EXISTS "Auth delete announcements" ON announcements;

CREATE POLICY "Auth read announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update announcements" ON announcements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete announcements" ON announcements FOR DELETE TO authenticated USING (true);

INSERT INTO announcements (
  title, subtitle, content, announcement_type, audience, publish_status,
  published_at, expires_at, views, created_at, updated_at
) VALUES
  (
    'Collection in Nahalinan on July 21, 2026',
    'Collection Schedule Update',
    'Please be informed that the collection in Nahalinan will start at 4:00 AM on July 21, 2026. Please prepare your waste accordingly.',
    'schedule', 'all_residents', 'publish_now',
    '2026-07-20 09:00:00+08', '2026-07-21 23:59:00+08', 245,
    '2026-07-20 09:00:00+08', '2026-07-20 09:00:00+08'
  ),
  (
    'Increased Waste Collection Fees',
    'Notice',
    'Starting August 2026, waste collection fees will be adjusted to support improved services across all barangays.',
    'notice', 'all_residents', 'publish_now',
    '2026-07-18 10:00:00+08', '2026-08-31 23:59:00+08', 189,
    '2026-07-18 10:00:00+08', '2026-07-18 10:00:00+08'
  ),
  (
    'Garbage Truck Arrival Times',
    'General',
    'Collection trucks are expected to arrive between 4:00 AM and 8:00 AM. Please have waste ready before 4:00 AM.',
    'general', 'all_residents', 'publish_now',
    '2026-07-15 08:30:00+08', '2026-07-31 23:59:00+08', 156,
    '2026-07-15 08:30:00+08', '2026-07-15 08:30:00+08'
  ),
  (
    'No Collection on Maintenance Day',
    'Schedule Update',
    'There will be no waste collection on July 26, 2026 due to scheduled vehicle maintenance.',
    'schedule', 'all_residents', 'publish_now',
    '2026-07-14 14:00:00+08', '2026-07-26 23:59:00+08', 98,
    '2026-07-14 14:00:00+08', '2026-07-14 14:00:00+08'
  ),
  (
    'Proper Waste Segregation Guidelines',
    'Guidelines',
    'Residents are reminded to segregate biodegradable, recyclable, and residual waste before collection.',
    'guidelines', 'all_residents', 'publish_now',
    '2026-07-12 11:00:00+08', '2026-12-31 23:59:00+08', 312,
    '2026-07-12 11:00:00+08', '2026-07-12 11:00:00+08'
  ),
  (
    'Upper Jasaan Collection Reminder',
    'Collection Schedule Update',
    'Upper Jasaan collection is scheduled for July 20, 2026 starting at 4:00 AM.',
    'schedule', 'barangay_residents', 'publish_now',
    '2026-07-19 07:00:00+08', '2026-07-20 23:59:00+08', 87,
    '2026-07-19 07:00:00+08', '2026-07-19 07:00:00+08'
  ),
  (
    'Holiday Collection Schedule',
    'Notice',
    'Collection schedules may change during holidays. Please check announcements for updates.',
    'notice', 'all_residents', 'scheduled',
    '2026-08-01 09:00:00+08', '2026-08-15 23:59:00+08', 0,
    '2026-07-25 09:00:00+08', '2026-07-25 09:00:00+08'
  ),
  (
    'Staff Training Day Announcement',
    'General',
    'Municipal waste management staff will undergo training on August 5, 2026. Hotline support remains available.',
    'general', 'staff', 'scheduled',
    '2026-08-05 08:00:00+08', '2026-08-05 17:00:00+08', 0,
    '2026-07-28 10:00:00+08', '2026-07-28 10:00:00+08'
  ),
  (
    'Solana Barangay Clean-Up Drive',
    'Guidelines',
    'Join the community clean-up drive in Solana on July 30, 2026. Waste collection follows at 2:00 PM.',
    'guidelines', 'barangay_residents', 'publish_now',
    '2026-07-22 13:00:00+08', '2026-07-30 23:59:00+08', 64,
    '2026-07-22 13:00:00+08', '2026-07-22 13:00:00+08'
  ),
  (
    'Expired: Old Fee Schedule',
    'Notice',
    'This announcement about the 2025 fee schedule is no longer active.',
    'notice', 'all_residents', 'publish_now',
    '2026-01-01 09:00:00+08', '2026-06-30 23:59:00+08', 420,
    '2026-01-01 09:00:00+08', '2026-01-01 09:00:00+08'
  ),
  (
    'Expired: January Collection Pause',
    'Schedule Update',
    'Collection pause notice from January 2026 — expired.',
    'schedule', 'all_residents', 'publish_now',
    '2026-01-10 09:00:00+08', '2026-01-15 23:59:00+08', 178,
    '2026-01-10 09:00:00+08', '2026-01-10 09:00:00+08'
  ),
  (
    'Aplaya Flood Advisory Waste Protocol',
    'Guidelines',
    'During flood season, place waste in sealed bags and follow barangay pickup points.',
    'guidelines', 'barangay_residents', 'publish_now',
    '2026-07-08 16:00:00+08', '2026-09-30 23:59:00+08', 53,
    '2026-07-08 16:00:00+08', '2026-07-08 16:00:00+08'
  ),
  (
    'Lower Jasaan Route Change',
    'Collection Schedule Update',
    'Collection route in Lower Jasaan has been updated effective July 22, 2026.',
    'schedule', 'barangay_residents', 'publish_now',
    '2026-07-21 08:00:00+08', '2026-08-21 23:59:00+08', 41,
    '2026-07-21 08:00:00+08', '2026-07-21 08:00:00+08'
  ),
  (
    'ECOTRACK System Launch',
    'General',
    'The ECOTRACK waste management system is now live for Jasaan LGU staff and residents.',
    'general', 'all_residents', 'publish_now',
    '2026-07-01 09:00:00+08', '2026-12-31 23:59:00+08', 502,
    '2026-07-01 09:00:00+08', '2026-07-01 09:00:00+08'
  ),
  (
    'Report Illegal Dumping',
    'Notice',
    'Report illegal dumping through the complaints module or barangay hotline.',
    'notice', 'all_residents', 'publish_now',
    '2026-07-05 10:00:00+08', '2026-12-31 23:59:00+08', 133,
    '2026-07-05 10:00:00+08', '2026-07-05 10:00:00+08'
  );
