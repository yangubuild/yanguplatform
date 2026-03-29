
-- Add source_type column to social_library_items
ALTER TABLE public.social_library_items 
ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'upload';

-- Add file_size column
ALTER TABLE public.social_library_items 
ADD COLUMN IF NOT EXISTS file_size bigint;

-- Add mime_type column
ALTER TABLE public.social_library_items 
ADD COLUMN IF NOT EXISTS mime_type text;

-- Create storage bucket for social media library
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-library', 'social-library', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users upload own social library files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-library' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: users can read own files
CREATE POLICY "Users read own social library files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'social-library' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for social-library (since bucket is public)
CREATE POLICY "Public read social library"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'social-library');

-- Storage RLS: users can delete own files
CREATE POLICY "Users delete own social library files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-library' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
