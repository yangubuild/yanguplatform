-- Create ada-uploads private bucket for file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ada-uploads', 'ada-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Clean idempotent drops (safe re-run)
DROP POLICY IF EXISTS "Users upload own ada files" ON storage.objects;
DROP POLICY IF EXISTS "Users read own ada files" ON storage.objects;

-- Users can upload to their own folder
CREATE POLICY "Users upload own ada files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ada-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "Users read own ada files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ada-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);