
-- Part C+F: Add trend boost to search_entities (freshness + recent reviews, gated by trust threshold)
CREATE OR REPLACE FUNCTION public.search_entities(
  p_query text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_subtype text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_visibility_tier text DEFAULT NULL,
  p_verified_only boolean DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, entity_type text, entity_subtype text, title text,
  short_description text, primary_category text, tags text[],
  visibility_tier text, is_verified boolean, domain_host text,
  slug text, industry text, surface_type text, cover_image_url text,
  published_at timestamptz, relevance_score real
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT se.id,
    se.entity_type::text, se.entity_subtype::text, se.title, se.short_description,
    se.primary_category, se.tags, se.visibility_tier::text, se.is_verified, se.domain_host,
    se.slug, se.industry, se.surface_type, se.cover_image_url, se.published_at,
    (
      -- TEXT MATCH: 0–40
      CASE WHEN p_query IS NOT NULL AND p_query != '' THEN
        CASE
          WHEN lower(se.title) = lower(p_query) THEN 40.0
          WHEN lower(se.title) LIKE lower(p_query) || '%' THEN 30.0
          WHEN lower(se.title) LIKE '%' || lower(p_query) || '%' THEN 20.0
          WHEN se.short_description IS NOT NULL AND lower(se.short_description) LIKE '%' || lower(p_query) || '%' THEN 10.0
          ELSE 0.0
        END
      ELSE 0.0 END
      -- TRUST SCORE: 0–45
      + (COALESCE(se.trust_score, 0) * 0.45)
      -- VERIFIED BONUS: +5
      + CASE WHEN se.is_verified THEN 5.0 ELSE 0.0 END
      -- VISIBILITY TIER: 0–5 (light tie-breaker)
      + CASE se.visibility_tier::text
          WHEN 'premium' THEN 5.0
          WHEN 'paid'    THEN 3.0
          WHEN 'verified' THEN 1.0
          ELSE 0.0
        END
      -- TREND BOOST: 0–8 (only if trust_score >= 15, so weak entities can't trend-spam)
      + CASE WHEN COALESCE(se.trust_score, 0) >= 15 THEN
          -- Freshness: up to +4 (updated within 14 days)
          CASE WHEN se.updated_at > now() - interval '14 days' THEN 4.0
               WHEN se.updated_at > now() - interval '30 days' THEN 2.0
               ELSE 0.0 END
          -- Recent reviews: up to +4 (review_count as activity proxy)
          + LEAST(COALESCE(se.review_count, 0)::real * 1.0, 4.0)
        ELSE 0.0 END
    )::real AS relevance_score
  FROM searchable_entities se
  WHERE se.is_searchable = true AND se.is_published = true
    AND (p_entity_type IS NULL OR se.entity_type::text = p_entity_type)
    AND (p_entity_subtype IS NULL OR se.entity_subtype::text = p_entity_subtype)
    AND (p_category IS NULL OR se.primary_category = p_category)
    AND (p_visibility_tier IS NULL OR se.visibility_tier::text = p_visibility_tier)
    AND (p_verified_only IS NULL OR p_verified_only = false OR se.is_verified = true)
    AND (p_query IS NULL OR p_query = '' OR
         lower(se.title) LIKE '%' || lower(p_query) || '%' OR
         lower(se.short_description) LIKE '%' || lower(p_query) || '%' OR
         lower(se.primary_category) LIKE '%' || lower(p_query) || '%' OR
         EXISTS (SELECT 1 FROM unnest(se.tags) t WHERE lower(t) LIKE '%' || lower(p_query) || '%'))
  ORDER BY relevance_score DESC, se.trust_score DESC, se.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
