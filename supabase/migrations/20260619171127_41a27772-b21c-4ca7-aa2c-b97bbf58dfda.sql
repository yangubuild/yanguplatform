
DROP POLICY IF EXISTS "Service role can upload social media files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update social media files" ON storage.objects;

CREATE POLICY "Authenticated can upload social media files"
  ON storage.objects
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'social-media');

CREATE POLICY "Service role can update social media files"
  ON storage.objects
  FOR UPDATE
  TO service_role
  USING (bucket_id = 'social-media')
  WITH CHECK (bucket_id = 'social-media');

CREATE POLICY "Service role can delete social media files"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'social-media');
