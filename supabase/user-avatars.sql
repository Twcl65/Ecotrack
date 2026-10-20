-- Run in the Supabase SQL Editor to enable profile picture uploads and
-- authenticated resident and driver profile updates.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'user-avatars',
  'user-avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Replace the broad system_users update policy with own resident/driver/admin access.
DROP POLICY IF EXISTS "Auth update system_users" ON public.system_users;
DROP POLICY IF EXISTS "Users update own driver profile" ON public.system_users;
DROP POLICY IF EXISTS "Users update own profile" ON public.system_users;
CREATE POLICY "Users update own profile"
ON public.system_users FOR UPDATE TO authenticated
USING (
  (id = auth.uid() AND role IN ('driver', 'resident', 'viewer'))
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
)
WITH CHECK (
  (id = auth.uid() AND role IN ('driver', 'resident', 'viewer'))
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
);

DROP POLICY IF EXISTS "Users upload own profile picture" ON storage.objects;
CREATE POLICY "Users upload own profile picture"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.uid()::text || '/%')
);

DROP POLICY IF EXISTS "Users update own profile picture" ON storage.objects;
CREATE POLICY "Users update own profile picture"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.uid()::text || '/%')
);

DROP POLICY IF EXISTS "Users delete own profile picture" ON storage.objects;
CREATE POLICY "Users delete own profile picture"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.uid()::text || '/%')
);

DROP POLICY IF EXISTS "Admins upload user profile pictures" ON storage.objects;
CREATE POLICY "Admins upload user profile pictures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
);

DROP POLICY IF EXISTS "Admins update user profile pictures" ON storage.objects;
CREATE POLICY "Admins update user profile pictures"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
);

DROP POLICY IF EXISTS "Admins delete user profile pictures" ON storage.objects;
CREATE POLICY "Admins delete user profile pictures"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'administrator'
  )
);
