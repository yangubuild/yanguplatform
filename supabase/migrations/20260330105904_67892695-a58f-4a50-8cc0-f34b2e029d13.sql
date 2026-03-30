INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('social-media', 'social-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view social media files" ON storage.objects
FOR SELECT USING (bucket_id = 'social-media');

CREATE POLICY "Service role can upload social media files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'social-media');

CREATE POLICY "Service role can update social media files" ON storage.objects
FOR UPDATE USING (bucket_id = 'social-media');
