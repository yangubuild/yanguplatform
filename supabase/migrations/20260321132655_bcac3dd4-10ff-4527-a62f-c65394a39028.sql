DROP FUNCTION IF EXISTS public.search_entities(text,text,text,text,text,boolean,integer,integer);

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
  published_at timestamptz, relevance_score real,
  builder_surface_type text, trust_score real, avg_rating real,
  review_count integer, avatar_url text, owner_display_name text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT se.id,
    se.entity_type::text, se.entity_subtype::text, se.title, se.short_description,
    se.primary_category, se.tags, se.visibility_tier::text, se.is_verified, se.domain_host,
    se.slug, se.industry, se.surface_type, se.cover_image_url, se.published_at,
    (
      CASE WHEN p_query IS NOT NULL AND p_query != '' THEN
        CASE
          WHEN lower(se.title) = lower(p_query) THEN 40.0
          WHEN lower(se.title) LIKE lower(p_query) || '%' THEN 30.0
          WHEN lower(se.title) LIKE '%' || lower(p_query) || '%' THEN 20.0
          WHEN se.short_description IS NOT NULL AND lower(se.short_description) LIKE '%' || lower(p_query) || '%' THEN 10.0
          ELSE 0.0
        END
      ELSE 0.0 END
      + (COALESCE(se.trust_score, 0) * 0.45)
      + CASE WHEN se.is_verified THEN 5.0 ELSE 0.0 END
      + CASE se.visibility_tier::text
          WHEN 'premium' THEN 5.0
          WHEN 'paid'    THEN 3.0
          WHEN 'verified' THEN 1.0
          ELSE 0.0
        END
      + CASE WHEN COALESCE(se.trust_score, 0) >= 15 THEN
          CASE WHEN se.updated_at > now() - interval '14 days' THEN 4.0
               WHEN se.updated_at > now() - interval '30 days' THEN 2.0
               ELSE 0.0 END
          + LEAST(COALESCE(se.review_count, 0)::real * 1.0, 4.0)
        ELSE 0.0 END
    )::real AS relevance_score,
    se.builder_surface_type,
    se.trust_score::real,
    se.avg_rating::real,
    se.review_count::integer,
    CASE
      WHEN p.avatar_mode = 'emoji' AND p.avatar_emoji_key IS NOT NULL
        THEN '/avatars/' || p.avatar_emoji_key || '.png'
      WHEN p.avatar_url IS NOT NULL AND p.avatar_url LIKE 'https://%'
        THEN p.avatar_url
      ELSE NULL
    END AS avatar_url,
    COALESCE(p.display_name, p.username) AS owner_display_name
  FROM searchable_entities se
  LEFT JOIN profiles p ON p.id = se.owner_user_id
  WHERE se.is_searchable = true AND se.is_published = true
    AND se.cover_image_url IS NOT NULL
    AND se.cover_image_url != ''
    AND se.cover_image_url NOT LIKE 'data:%'
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