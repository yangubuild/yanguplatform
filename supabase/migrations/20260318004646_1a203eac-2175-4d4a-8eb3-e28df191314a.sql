
-- Part A+B: Intelligent related entities RPC with same-type, cross-category, tag overlap, trust band
CREATE OR REPLACE FUNCTION public.get_related_entities(
  p_entity_id uuid,
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id uuid, entity_type text, entity_subtype text, title text,
  short_description text, primary_category text, tags text[],
  visibility_tier text, is_verified boolean, domain_host text,
  slug text, industry text, surface_type text, cover_image_url text,
  published_at timestamptz, trust_score real, relatedness_score real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type searchable_entity_type;
  v_category text;
  v_tags text[];
  v_trust real;
  v_industry text;
BEGIN
  -- Fetch source entity attributes
  SELECT se.entity_type, se.primary_category, se.tags, COALESCE(se.trust_score,0), se.industry
    INTO v_entity_type, v_category, v_tags, v_trust, v_industry
  FROM searchable_entities se WHERE se.id = p_entity_id;

  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    se.id,
    se.entity_type::text,
    se.entity_subtype::text,
    se.title,
    se.short_description,
    se.primary_category,
    se.tags,
    se.visibility_tier::text,
    se.is_verified,
    se.domain_host,
    se.slug,
    se.industry,
    se.surface_type,
    se.cover_image_url,
    se.published_at,
    se.trust_score,
    (
      -- Same entity_type: +30
      CASE WHEN se.entity_type = v_entity_type THEN 30.0 ELSE 0.0 END
      -- Same category: +25
      + CASE WHEN v_category IS NOT NULL AND se.primary_category = v_category THEN 25.0 ELSE 0.0 END
      -- Same industry: +10
      + CASE WHEN v_industry IS NOT NULL AND se.industry = v_industry THEN 10.0 ELSE 0.0 END
      -- Tag overlap: up to +20 (5 per shared tag, max 4)
      + LEAST(
          (SELECT COUNT(*)::real FROM unnest(v_tags) vt INNER JOIN unnest(se.tags) st ON lower(vt) = lower(st)) * 5.0,
          20.0
        )
      -- Trust band proximity: +15 max (closer trust = higher score)
      + GREATEST(0.0, 15.0 - ABS(COALESCE(se.trust_score,0) - v_trust) * 0.3)
      -- Verified bonus: +5
      + CASE WHEN se.is_verified THEN 5.0 ELSE 0.0 END
      -- Freshness bonus: +5 if updated within 30 days
      + CASE WHEN se.updated_at > now() - interval '30 days' THEN 5.0 ELSE 0.0 END
    )::real AS relatedness_score
  FROM searchable_entities se
  WHERE se.id != p_entity_id
    AND se.is_searchable = true
    AND se.is_published = true
    -- Must share at least one signal: same type, same category, same industry, or overlapping tags
    AND (
      se.entity_type = v_entity_type
      OR (v_category IS NOT NULL AND se.primary_category = v_category)
      OR (v_industry IS NOT NULL AND se.industry = v_industry)
      OR EXISTS (SELECT 1 FROM unnest(v_tags) vt INNER JOIN unnest(se.tags) st ON lower(vt) = lower(st))
    )
  ORDER BY relatedness_score DESC, se.trust_score DESC, se.updated_at DESC
  LIMIT p_limit;
END;
$$;
