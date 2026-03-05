
-- Add new columns to visionaire_items for detail pages
ALTER TABLE public.visionaire_items 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS file_size text,
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS preview_image_url text,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Generate slugs from titles for existing rows that don't have one
UPDATE public.visionaire_items 
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Create unique index on slug (allowing nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visionaire_items_slug ON public.visionaire_items(slug) WHERE slug IS NOT NULL;

-- Delete old placeholder/seed items that are NOT real imported ebooks
-- Keep items that have real thumbnail URLs from entrepedia-products.com
DELETE FROM public.visionaire_items 
WHERE thumbnail_url IS NULL 
   OR thumbnail_url NOT LIKE '%entrepedia%';
