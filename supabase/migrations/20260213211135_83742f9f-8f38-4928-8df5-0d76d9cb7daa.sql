
-- A) Fix storage UPDATE policy (missing WITH CHECK causes RLS violation)
DROP POLICY IF EXISTS "Admin update blog-section-images" ON storage.objects;
CREATE POLICY "Admin update blog-section-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-section-images' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'blog-section-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- B) Ensure blog_section_images table has proper RLS policies
-- Drop and recreate to be idempotent
DROP POLICY IF EXISTS "Admins can manage blog section images" ON public.blog_section_images;
DROP POLICY IF EXISTS "Anyone can read blog section images" ON public.blog_section_images;

-- Separate admin policies per operation for clarity
CREATE POLICY "Public can read blog section images"
  ON public.blog_section_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert blog section images"
  ON public.blog_section_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog section images"
  ON public.blog_section_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog section images"
  ON public.blog_section_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_blog_section_images_updated_at ON public.blog_section_images;
CREATE TRIGGER update_blog_section_images_updated_at
  BEFORE UPDATE ON public.blog_section_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
