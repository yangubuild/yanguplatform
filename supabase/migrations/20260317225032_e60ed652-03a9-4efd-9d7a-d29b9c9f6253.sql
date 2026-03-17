-- Fix derive_entity_type to handle both builder_surface_type and surface_type enum values
CREATE OR REPLACE FUNCTION public.derive_entity_type(p_surface_type text)
RETURNS public.searchable_entity_type
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_surface_type
    -- builder_surface_type values
    WHEN 'eshop' THEN 'business'::public.searchable_entity_type
    WHEN 'emenu' THEN 'business'::public.searchable_entity_type
    WHEN 'quick_site' THEN 'business'::public.searchable_entity_type
    WHEN 'store_listing' THEN 'business'::public.searchable_entity_type
    WHEN 'live_bio' THEN 'creator'::public.searchable_entity_type
    WHEN 'live_selling' THEN 'creator'::public.searchable_entity_type
    WHEN 'community_group' THEN 'community'::public.searchable_entity_type
    WHEN 'community_listing' THEN 'community'::public.searchable_entity_type
    WHEN 'studio_showcase' THEN 'project'::public.searchable_entity_type
    -- surface_type (domain-level) values
    WHEN 'shop' THEN 'business'::public.searchable_entity_type
    WHEN 'store' THEN 'business'::public.searchable_entity_type
    WHEN 'site' THEN 'business'::public.searchable_entity_type
    WHEN 'live' THEN 'creator'::public.searchable_entity_type
    WHEN 'community' THEN 'community'::public.searchable_entity_type
    WHEN 'studio' THEN 'project'::public.searchable_entity_type
    ELSE 'business'::public.searchable_entity_type
  END;
$$;

-- Also fix derive_entity_subtype for domain-level types
CREATE OR REPLACE FUNCTION public.derive_entity_subtype(
  p_surface_type text,
  p_industry text DEFAULT NULL
)
RETURNS public.entity_subtype
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'church' THEN 'church'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'pastors' THEN 'ministry'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'ngo' THEN 'ngo'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'school' THEN 'school'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'institutions' THEN 'institution'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'coaches' THEN 'coach'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'freelancers' THEN 'freelancer'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'leaders' THEN 'leader'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'professional' THEN 'professional_network'::public.entity_subtype
    WHEN p_surface_type IN ('community_group','community_listing','community') AND p_industry = 'therapists' THEN 'consultant'::public.entity_subtype
    WHEN p_surface_type IN ('live_bio','live_selling','live') THEN 'influencer'::public.entity_subtype
    ELSE 'general'::public.entity_subtype
  END;
$$;

-- Re-backfill all existing surfaces
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM surfaces WHERE archived_at IS NULL LOOP
    PERFORM sync_searchable_entity(r.id);
  END LOOP;
END;
$$;