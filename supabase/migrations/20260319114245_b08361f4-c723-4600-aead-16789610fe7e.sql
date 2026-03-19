
-- Add surface metadata columns for SEO/branding (Block A + D)
ALTER TABLE public.builder_surfaces 
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add review_count and avg_rating to searchable_entities if it exists (Block H)
-- These will be used for Explore ranking
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'searchable_entities') THEN
    ALTER TABLE public.searchable_entities ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
    ALTER TABLE public.searchable_entities ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
  END IF;
END $$;
