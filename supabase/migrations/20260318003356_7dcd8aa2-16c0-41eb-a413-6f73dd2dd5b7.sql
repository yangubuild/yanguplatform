
-- Step 2: Trust scoring functions + upgraded search/detail RPCs

-- Compute trust score (deterministic, graceful with sparse data)
CREATE OR REPLACE FUNCTION public.compute_trust_score(
  p_is_verified boolean,
  p_review_count integer,
  p_avg_rating real,
  p_has_cover boolean,
  p_has_description boolean,
  p_has_tags boolean,
  p_report_count integer,
  p_published_at timestamptz
) RETURNS real
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (
    (CASE WHEN p_is_verified THEN 25.0 ELSE 0.0 END) +
    LEAST(25.0, COALESCE(p_review_count, 0)::real / 2.0) +
    (CASE WHEN COALESCE(p_review_count, 0) > 0 AND p_avg_rating IS NOT NULL
      THEN (p_avg_rating / 5.0) * 20.0 ELSE 0.0 END) +
    (CASE WHEN p_has_cover THEN 5.0 ELSE 0.0 END) +
    (CASE WHEN p_has_description THEN 5.0 ELSE 0.0 END) +
    (CASE WHEN p_has_tags THEN 5.0 ELSE 0.0 END) +
    (CASE WHEN p_published_at IS NOT NULL THEN
      GREATEST(0.0, 10.0 - (EXTRACT(EPOCH FROM (now() - p_published_at)) / 86400.0 / 90.0 * 10.0))
      ELSE 0.0 END) -
    LEAST(25.0, COALESCE(p_report_count, 0)::real * 5.0)
  )::real
$$;

-- Refresh trust score for one entity
CREATE OR REPLACE FUNCTION public.refresh_entity_trust_score(p_entity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rc integer; v_ar real; v_rpt integer;
  v_row searchable_entities%ROWTYPE; v_score real;
BEGIN
  SELECT COUNT(*)::integer, AVG(rating)::real INTO v_rc, v_ar
    FROM entity_reviews WHERE entity_id = p_entity_id AND is_visible = true;
  SELECT COUNT(*)::integer INTO v_rpt
    FROM entity_reports WHERE entity_id = p_entity_id AND status != 'dismissed';
  SELECT * INTO v_row FROM searchable_entities WHERE id = p_entity_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_score := compute_trust_score(
    v_row.is_verified, v_rc, v_ar,
    v_row.cover_image_url IS NOT NULL,
    v_row.short_description IS NOT NULL AND v_row.short_description != '',
    array_length(v_row.tags, 1) IS NOT NULL AND array_length(v_row.tags, 1) > 0,
    v_rpt, v_row.published_at
  );
  UPDATE searchable_entities
    SET trust_score = v_score, review_count = v_rc, avg_rating = v_ar,
        report_count = v_rpt, updated_at = now()
    WHERE id = p_entity_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_entity_trust_score(uuid) FROM anon, authenticated;

-- Triggers
CREATE OR REPLACE FUNCTION public.trg_refresh_trust_on_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM refresh_entity_trust_score(OLD.entity_id); RETURN OLD; END IF;
  PERFORM refresh_entity_trust_score(NEW.entity_id); RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_refresh_trust_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM refresh_entity_trust_score(OLD.entity_id); RETURN OLD; END IF;
  PERFORM refresh_entity_trust_score(NEW.entity_id); RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_review_trust_refresh ON public.entity_reviews;
CREATE TRIGGER trg_review_trust_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.entity_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_trust_on_review();

DROP TRIGGER IF EXISTS trg_report_trust_refresh ON public.entity_reports;
CREATE TRIGGER trg_report_trust_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.entity_reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_trust_on_report();

-- Recreate search_entities with trust-aware ranking
CREATE FUNCTION public.search_entities(
  p_query text DEFAULT NULL,
  p_entity_type searchable_entity_type DEFAULT NULL,
  p_entity_subtype entity_subtype DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_visibility_tier visibility_tier DEFAULT NULL,
  p_verified_only boolean DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, entity_type searchable_entity_type, entity_subtype entity_subtype,
  title text, short_description text, primary_category text, tags text[],
  visibility_tier visibility_tier, is_verified boolean, domain_host text,
  slug text, industry text, surface_type text, cover_image_url text,
  published_at timestamptz, relevance_score real
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT se.id, se.entity_type, se.entity_subtype, se.title, se.short_description,
    se.primary_category, se.tags, se.visibility_tier, se.is_verified, se.domain_host,
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
      ELSE 0.0 END +
      (se.trust_score * 0.3) +
      CASE se.visibility_tier WHEN 'premium' THEN 20.0 WHEN 'paid' THEN 15.0 WHEN 'verified' THEN 10.0 ELSE 0.0 END +
      CASE WHEN se.is_verified THEN 5.0 ELSE 0.0 END
    )::real AS relevance_score
  FROM searchable_entities se
  WHERE se.is_searchable = true AND se.is_published = true
    AND (p_entity_type IS NULL OR se.entity_type = p_entity_type)
    AND (p_entity_subtype IS NULL OR se.entity_subtype = p_entity_subtype)
    AND (p_category IS NULL OR se.primary_category = p_category)
    AND (p_visibility_tier IS NULL OR se.visibility_tier = p_visibility_tier)
    AND (p_verified_only IS NULL OR p_verified_only = false OR se.is_verified = true)
    AND (p_query IS NULL OR p_query = '' OR
         lower(se.title) LIKE '%' || lower(p_query) || '%' OR
         lower(se.short_description) LIKE '%' || lower(p_query) || '%' OR
         lower(se.primary_category) LIKE '%' || lower(p_query) || '%' OR
         EXISTS (SELECT 1 FROM unnest(se.tags) t WHERE lower(t) LIKE '%' || lower(p_query) || '%'))
  ORDER BY relevance_score DESC, se.trust_score DESC, se.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.search_entities TO anon, authenticated;

-- Recreate get_entity_by_slug with trust_score
CREATE FUNCTION public.get_entity_by_slug(p_slug text)
RETURNS TABLE(
  id uuid, entity_type text, entity_subtype text, title text,
  short_description text, primary_category text, tags text[],
  visibility_tier text, is_verified boolean, domain_host text,
  slug text, industry text, surface_type text, cover_image_url text,
  published_at timestamptz, owner_user_id uuid, review_count bigint,
  avg_rating real, trust_score real
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT se.id, se.entity_type::text, se.entity_subtype::text, se.title,
    se.short_description, se.primary_category, se.tags, se.visibility_tier::text,
    se.is_verified, se.domain_host, se.slug, se.industry, se.surface_type,
    se.cover_image_url, se.published_at, se.owner_user_id,
    COALESCE(se.review_count, 0)::bigint, se.avg_rating, se.trust_score
  FROM searchable_entities se
  WHERE se.slug = p_slug AND se.is_published = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_entity_by_slug TO anon, authenticated;

-- Backfill trust scores
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT id FROM searchable_entities LOOP
  PERFORM refresh_entity_trust_score(r.id);
END LOOP; END; $$;
