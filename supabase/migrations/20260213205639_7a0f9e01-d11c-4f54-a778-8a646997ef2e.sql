
-- Create public storage bucket for blog section images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-section-images', 'blog-section-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read blog-section-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-section-images');

-- Admin write access (authenticated users with admin role)
CREATE POLICY "Admin insert blog-section-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-section-images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin update blog-section-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-section-images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin delete blog-section-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-section-images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
);
