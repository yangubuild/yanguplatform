-- Search contract RPC: canonical search across all entity types
-- Future search UI will call this
CREATE OR REPLACE FUNCTION public.search_entities(
  p_query text DEFAULT NULL,
  p_entity_type public.searchable_entity_type DEFAULT NULL,
  p_entity_subtype public.entity_subtype DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_visibility_tier public.visibility_tier DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  entity_type public.searchable_entity_type,
  entity_subtype public.entity_subtype,
  title text,
  short_description text,
  primary_category text,
  tags text[],
  visibility_tier public.visibility_tier,
  is_verified boolean,
  domain_host text,
  slug text,
  industry text,
  surface_type text,
  cover_image_url text,
  published_at timestamptz,
  relevance_score float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id,
    se.entity_type,
    se.entity_subtype,
    se.title,
    se.short_description,
    se.primary_category,
    se.tags,
    se.visibility_tier,
    se.is_verified,
    se.domain_host,
    se.slug,
    se.industry,
    se.surface_type,
    se.cover_image_url,
    se.published_at,
    CASE
      WHEN p_query IS NOT NULL AND p_query != '' THEN
        similarity(se.title, p_query) * 0.6 +
        COALESCE(similarity(se.short_description, p_query), 0) * 0.3 +
        COALESCE(similarity(se.primary_category, p_query), 0) * 0.1
      ELSE 1.0
    END::float AS relevance_score
  FROM searchable_entities se
  WHERE se.is_searchable = true
    AND se.is_published = true
    AND (p_entity_type IS NULL OR se.entity_type = p_entity_type)
    AND (p_entity_subtype IS NULL OR se.entity_subtype = p_entity_subtype)
    AND (p_category IS NULL OR se.primary_category = p_category)
    AND (p_visibility_tier IS NULL OR se.visibility_tier = p_visibility_tier)
    AND (p_verified_only = false OR se.is_verified = true)
    AND (
      p_query IS NULL OR p_query = '' OR
      similarity(se.title, p_query) > 0.1 OR
      similarity(COALESCE(se.short_description,''), p_query) > 0.1 OR
      se.tags && ARRAY[lower(p_query)]
    )
  ORDER BY
    -- Paid/premium first, then verified, then free
    CASE se.visibility_tier
      WHEN 'premium' THEN 4
      WHEN 'paid' THEN 3
      WHEN 'verified' THEN 2
      WHEN 'free' THEN 1
    END DESC,
    relevance_score DESC,
    se.published_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Admin RPC for management panel
CREATE OR REPLACE FUNCTION public.manage_searchable_entities(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_entity_type text DEFAULT NULL,
  p_searchable_only boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  surface_id uuid,
  entity_type text,
  entity_subtype text,
  title text,
  short_description text,
  primary_category text,
  tags text[],
  visibility_tier text,
  is_searchable boolean,
  is_published boolean,
  is_verified boolean,
  is_ad_eligible boolean,
  domain_host text,
  slug text,
  industry text,
  surface_type text,
  builder_surface_type text,
  cover_image_url text,
  created_at timestamptz,
  published_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT count(*) INTO v_total
  FROM searchable_entities se
  WHERE (p_entity_type IS NULL OR se.entity_type::text = p_entity_type)
    AND (p_searchable_only = false OR se.is_searchable = true);

  RETURN QUERY
  SELECT
    se.id,
    se.surface_id,
    se.entity_type::text,
    se.entity_subtype::text,
    se.title,
    se.short_description,
    se.primary_category,
    se.tags,
    se.visibility_tier::text,
    se.is_searchable,
    se.is_published,
    se.is_verified,
    se.is_ad_eligible,
    se.domain_host,
    se.slug,
    se.industry,
    se.surface_type,
    se.builder_surface_type,
    se.cover_image_url,
    se.created_at,
    se.published_at,
    v_total
  FROM searchable_entities se
  WHERE (p_entity_type IS NULL OR se.entity_type::text = p_entity_type)
    AND (p_searchable_only = false OR se.is_searchable = true)
  ORDER BY se.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Backfill: sync all existing surfaces into searchable_entities
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM surfaces WHERE archived_at IS NULL LOOP
    PERFORM sync_searchable_entity(r.id);
  END LOOP;
END;
$$;