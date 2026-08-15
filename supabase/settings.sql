-- App settings (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  system_name TEXT NOT NULL DEFAULT 'ECOTRACK',
  system_tagline TEXT NOT NULL DEFAULT 'Cleaner Jasaan, Greener Tomorrow',
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  language TEXT NOT NULL DEFAULT 'English',
  items_per_page INT NOT NULL DEFAULT 10 CHECK (items_per_page > 0),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  session_timeout_minutes INT NOT NULL DEFAULT 30 CHECK (session_timeout_minutes > 0),
  enable_audit_log BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  complaint_alerts BOOLEAN NOT NULL DEFAULT true,
  schedule_reminders BOOLEAN NOT NULL DEFAULT true,
  auto_backup_enabled BOOLEAN NOT NULL DEFAULT true,
  backup_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  backup_retention_days INT NOT NULL DEFAULT 30 CHECK (backup_retention_days > 0),
  require_strong_password BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  login_attempt_limit INT NOT NULL DEFAULT 5 CHECK (login_attempt_limit > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Auth insert app_settings" ON app_settings;
DROP POLICY IF EXISTS "Auth update app_settings" ON app_settings;

CREATE POLICY "Auth read app_settings" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert app_settings" ON app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update app_settings" ON app_settings FOR UPDATE TO authenticated USING (true);

INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
