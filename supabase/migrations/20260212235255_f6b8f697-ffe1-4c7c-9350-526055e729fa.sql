-- Create ada-audio private bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('ada-audio', 'ada-audio', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ada-audio
DROP POLICY IF EXISTS "Users upload own ada audio" ON storage.objects;
DROP POLICY IF EXISTS "Users read own ada audio" ON storage.objects;

CREATE POLICY "Users upload own ada audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ada-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own ada audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ada-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);