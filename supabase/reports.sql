-- Generated reports (run in Supabase SQL Editor)

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

DROP POLICY IF EXISTS "Auth read generated_reports" ON generated_reports;
DROP POLICY IF EXISTS "Auth insert generated_reports" ON generated_reports;
DROP POLICY IF EXISTS "Auth delete generated_reports" ON generated_reports;

CREATE POLICY "Auth read generated_reports"
  ON generated_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert generated_reports"
  ON generated_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth delete generated_reports"
  ON generated_reports FOR DELETE TO authenticated USING (true);

INSERT INTO generated_reports (report_name, report_type, period_label, generated_by, generated_at, from_date, to_date) VALUES
  ('Collection Report', 'collection', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:30:00+08', '2026-07-01', '2026-07-31'),
  ('Barangay Collection Report', 'barangay', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:15:00+08', '2026-07-01', '2026-07-31'),
  ('Complaint Report', 'complaint', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 10:00:00+08', '2026-07-01', '2026-07-31'),
  ('Driver Performance Report', 'driver', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:45:00+08', '2026-07-01', '2026-07-31'),
  ('Route Report', 'route', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:30:00+08', '2026-07-01', '2026-07-31'),
  ('User Report', 'user', 'Jul 1 - Jul 31, 2026', 'Admin', '2026-07-31 09:15:00+08', '2026-07-01', '2026-07-31')
ON CONFLICT DO NOTHING;
