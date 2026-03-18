
-- Landing banners table for editable hero banners (Banner 2 & 3)
CREATE TABLE public.landing_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL UNIQUE,
  image_url TEXT,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_banners ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view active banners
CREATE POLICY "Anyone can read active banners"
  ON public.landing_banners
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin write: only admins can modify banners
CREATE POLICY "Admins can manage banners"
  ON public.landing_banners
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default banner data
INSERT INTO public.landing_banners (slot, headline, subheadline, cta_text, is_active)
VALUES
  ('middle', 'yangu for enterprise', 'yangu isn''t just for the best solo entrepreneurs, it''s also effective for enterprises.', 'Learn more', true),
  ('lower', 'Meet yangu Treasury', 'Earn up to 6% yield on your cash.', 'Get started', true);
