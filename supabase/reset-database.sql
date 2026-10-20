-- ECOTRACK: Reset application data (keeps schema + landing feature cards)
-- Clears operational/demo data in public tables.
--
-- IMPORTANT: Auth users are NOT removed by this SQL alone.
-- Run the full reset (including auth) with:
--   node scripts/reset-database.mjs
--
-- Admin kept in script:
--   admin@ecotrack.com / admineco

BEGIN;

-- Child tables first
DELETE FROM route_stops;
DELETE FROM collections;
DELETE FROM collection_schedules;
DELETE FROM complaints;
DELETE FROM announcements;
DELETE FROM generated_reports;
DELETE FROM routes;
DELETE FROM barangays;

-- Optional legacy dashboard tables (only if you ran full schema.sql)
-- DELETE FROM collection_trends;
-- DELETE FROM weekly_schedules;
-- DELETE FROM collection_status_summary;

-- Users (directory only — auth.users cleaned via Node script)
DELETE FROM system_users WHERE lower(email) <> 'admin@ecotrack.com';

-- Singleton / summary tables
UPDATE site_metrics
SET total_routes = 0,
    active_collections = 0,
    total_distance_km = 0,
    updated_at = NOW()
WHERE id = 1;

INSERT INTO site_metrics (id, total_routes, active_collections, total_distance_km)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  total_routes = 0,
  active_collections = 0,
  total_distance_km = 0,
  updated_at = NOW();

UPDATE dashboard_kpis
SET todays_collection = 0,
    total_barangay = 0,
    total_complaint = 0,
    waste_collected_kg = 0,
    updated_at = NOW()
WHERE id = 1;

INSERT INTO dashboard_kpis (id, todays_collection, total_barangay, total_complaint, waste_collected_kg)
VALUES (1, 0, 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  todays_collection = 0,
  total_barangay = 0,
  total_complaint = 0,
  waste_collected_kg = 0,
  updated_at = NOW();

UPDATE app_settings
SET system_name = 'ECOTRACK',
    system_tagline = 'Cleaner Jasaan, Greener Tomorrow',
    timezone = 'Asia/Manila',
    date_format = 'MM/DD/YYYY',
    time_format = '24h',
    language = 'English',
    items_per_page = 10,
    maintenance_mode = false,
    session_timeout_minutes = 30,
    enable_audit_log = true,
    email_notifications = true,
    push_notifications = true,
    complaint_alerts = true,
    schedule_reminders = true,
    auto_backup_enabled = true,
    backup_frequency = 'daily',
    backup_retention_days = 30,
    require_strong_password = true,
    two_factor_enabled = false,
    login_attempt_limit = 5,
    updated_at = NOW()
WHERE id = 1;

INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
