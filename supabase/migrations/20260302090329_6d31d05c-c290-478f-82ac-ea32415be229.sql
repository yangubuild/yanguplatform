INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own profile media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');