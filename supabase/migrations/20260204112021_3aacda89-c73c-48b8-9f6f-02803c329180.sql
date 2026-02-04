-- PHASE 2 — Step 4: Make publishes routable (slug + is_primary)

-- 1) Add slug column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='surface_publishes' AND column_name='slug'
  ) THEN
    ALTER TABLE public.surface_publishes ADD COLUMN slug text;
  END IF;
END $$;

-- 2) Add is_primary column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='surface_publishes' AND column_name='is_primary'
  ) THEN
    ALTER TABLE public.surface_publishes ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3) Create index on (domain_id, slug) for fast lookups
CREATE INDEX IF NOT EXISTS idx_surface_publishes_domain_slug 
  ON public.surface_publishes(domain_id, slug);

-- 4) Create partial index for primary surface per domain
CREATE INDEX IF NOT EXISTS idx_surface_publishes_domain_primary 
  ON public.surface_publishes(domain_id) 
  WHERE is_primary = true AND unpublished_at IS NULL;

-- 5) Partial unique constraint: one active slug per domain
-- First drop if exists (to allow re-running)
DROP INDEX IF EXISTS surface_publishes_domain_slug_active_unique;
CREATE UNIQUE INDEX surface_publishes_domain_slug_active_unique 
  ON public.surface_publishes(domain_id, slug) 
  WHERE unpublished_at IS NULL AND slug IS NOT NULL;

-- 6) Partial unique constraint: one active primary per domain
DROP INDEX IF EXISTS surface_publishes_domain_primary_unique;
CREATE UNIQUE INDEX surface_publishes_domain_primary_unique 
  ON public.surface_publishes(domain_id) 
  WHERE is_primary = true AND unpublished_at IS NULL;