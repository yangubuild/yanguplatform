CREATE POLICY "Service role can upload video files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-generated-video'
  AND auth.role() = 'service_role'
);