-- Complaint attachment storage (run in Supabase SQL Editor)

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Auth upload complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Auth update complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete complaint attachments" ON storage.objects;

CREATE POLICY "Auth upload complaint attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Public read complaint attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Auth update complaint attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Auth delete complaint attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complaint-attachments');
