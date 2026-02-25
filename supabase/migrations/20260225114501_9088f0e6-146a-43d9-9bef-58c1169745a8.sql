-- Add community_listing to enum
ALTER TYPE public.builder_surface_type 
ADD VALUE IF NOT EXISTS 'community_listing';

-- Correct helper update (DO NOT change param order)
CREATE OR REPLACE FUNCTION public.builder_is_domain_allowed(
  p_surface_type text,
  p_host text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE p_surface_type
    WHEN 'live_bio'          THEN p_host = 'yangu.live'
    WHEN 'live_selling'      THEN p_host = 'yangu.live'
    WHEN 'community_group'   THEN p_host = 'yangu.community'
    WHEN 'community_listing' THEN p_host = 'yangu.community'
    WHEN 'eshop'             THEN p_host = 'yangu.shop'
    WHEN 'store_listing'     THEN p_host = 'yangu.store'
    WHEN 'quick_site'        THEN p_host = 'yangu.site'
    WHEN 'emenu'             THEN p_host = 'yangu.site'
    WHEN 'studio_showcase'   THEN p_host = 'yangu.studio'
    ELSE false
  END;
END;
$$;