
CREATE TABLE public.blog_section_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_key, slot_key)
);

ALTER TABLE public.blog_section_images ENABLE ROW LEVEL SECURITY;

-- Public read for frontend
CREATE POLICY "Anyone can read blog section images"
  ON public.blog_section_images FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins can manage blog section images"
  ON public.blog_section_images FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
