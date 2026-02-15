
-- Create studio-assets bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-assets', 'studio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Studio assets are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload studio assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own studio assets" ON storage.objects;

-- Recreate policies
CREATE POLICY "Studio assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-assets');

CREATE POLICY "Users can upload studio assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'studio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own studio assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'studio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
