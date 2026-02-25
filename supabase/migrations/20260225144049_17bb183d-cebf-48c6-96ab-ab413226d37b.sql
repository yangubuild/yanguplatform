
-- Create builder-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'builder-media',
  'builder-media',
  true,
  20971520, -- 20MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Builder media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'builder-media');

-- Owner insert policy (path format: userId/surfaceId/filename)
CREATE POLICY "Users can upload their own builder media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'builder-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owner update policy
CREATE POLICY "Users can update their own builder media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'builder-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owner delete policy
CREATE POLICY "Users can delete their own builder media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'builder-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
