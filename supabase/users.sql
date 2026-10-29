-- System users for User Management page (run in Supabase SQL Editor)
-- Passwords are stored in Supabase Auth (auth.users), not in this table.
-- Users created via "Add New User" or mobile registration share their auth id.
-- Remove the demo directory rows previously seeded by this script.
-- Existing Supabase Auth accounts are also imported into the directory.

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
  email_verified_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE system_users
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read system_users" ON system_users;
DROP POLICY IF EXISTS "Auth insert system_users" ON system_users;
DROP POLICY IF EXISTS "Auth update system_users" ON system_users;
DROP POLICY IF EXISTS "Auth delete system_users" ON system_users;

CREATE POLICY "Auth read system_users" ON system_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert system_users" ON system_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update system_users" ON system_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete system_users" ON system_users FOR DELETE TO authenticated USING (true);

DELETE FROM system_users
WHERE user_code BETWEEN 'USR-2025-0001' AND 'USR-2025-0028';

-- Keep mobile signups visible in the admin User Management directory.
-- Run this script after schema.sql so the profiles table and signup trigger exist.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_username TEXT;
BEGIN
  v_full_name := regexp_replace(
    btrim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')),
    '\s+',
    ' ',
    'g'
  );
  IF v_full_name = '' THEN
    v_full_name := split_part(COALESCE(NEW.email, ''), '@', 1);
  END IF;
  IF v_full_name = '' THEN
    v_full_name := 'Resident';
  END IF;

  v_first_name := split_part(v_full_name, ' ', 1);
  v_last_name := btrim(substr(v_full_name, length(v_first_name) + 1));
  v_username := lower(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'resident'
  ));

  IF EXISTS (
    SELECT 1 FROM public.system_users AS existing_user
    WHERE existing_user.username = v_username
  ) OR EXISTS (
    SELECT 1 FROM public.profiles AS existing_profile
    WHERE existing_profile.username = v_username
  ) THEN
    v_username := v_username || '.' || replace(NEW.id::TEXT, '-', '');
  END IF;

  INSERT INTO public.profiles (id, username, full_name, role, email, phone)
  VALUES (
    NEW.id,
    v_username,
    v_full_name,
    'viewer',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  INSERT INTO public.system_users (
    id,
    user_code,
    first_name,
    middle_name,
    last_name,
    email,
    phone,
    role,
    username,
    status,
    email_verified_at
  )
  VALUES (
    NEW.id,
    'USR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || upper(replace(NEW.id::TEXT, '-', '')),
    v_first_name,
    NULL,
    v_last_name,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'resident',
    v_username,
    'active',
    NEW.email_confirmed_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.system_users (
  id,
  user_code,
  first_name,
  middle_name,
  last_name,
  email,
  phone,
  role,
  username,
  status,
  email_verified_at
)
SELECT
  auth_user.id,
  'USR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || upper(replace(auth_user.id::TEXT, '-', '')),
  split_part(user_data.full_name, ' ', 1),
  NULL,
  COALESCE(NULLIF(btrim(substr(user_data.full_name, length(split_part(user_data.full_name, ' ', 1)) + 1)), ''), 'Resident'),
  auth_user.email,
  COALESCE(user_data.phone, ''),
  CASE user_data.profile_role
    WHEN 'administrator' THEN 'admin'
    WHEN 'admin' THEN 'admin'
    WHEN 'driver' THEN 'driver'
    ELSE 'resident'
  END,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.system_users AS existing_user
      WHERE existing_user.username = user_data.username
        AND existing_user.id <> auth_user.id
    ) THEN user_data.username || '.' || replace(auth_user.id::TEXT, '-', '')
    ELSE user_data.username
  END,
  'active',
  auth_user.email_confirmed_at
FROM auth.users AS auth_user
LEFT JOIN public.profiles AS profile ON profile.id = auth_user.id
CROSS JOIN LATERAL (
  SELECT
    COALESCE(
      NULLIF(regexp_replace(btrim(profile.full_name), '\s+', ' ', 'g'), ''),
      split_part(auth_user.email, '@', 1),
      'Resident'
    ) AS full_name,
    COALESCE(profile.phone, auth_user.raw_user_meta_data->>'phone', '') AS phone,
    profile.role AS profile_role,
    lower(COALESCE(
      NULLIF(profile.username, ''),
      split_part(auth_user.email, '@', 1) || '.' ||
        replace(auth_user.id::TEXT, '-', ''),
      'resident'
    )) AS username
) AS user_data
WHERE auth_user.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.system_users AS existing_user
    WHERE existing_user.id = auth_user.id
  )
ON CONFLICT DO NOTHING;

UPDATE public.system_users AS su
SET email_verified_at = auth_user.email_confirmed_at
FROM auth.users AS auth_user
WHERE su.id = auth_user.id
  AND su.email_verified_at IS DISTINCT FROM auth_user.email_confirmed_at;

CREATE OR REPLACE FUNCTION public.sync_system_user_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.system_users
  SET email_verified_at = NEW.email_confirmed_at,
      updated_at = NOW()
  WHERE id = NEW.id
    AND email_verified_at IS DISTINCT FROM NEW.email_confirmed_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_system_user_email_verification();
