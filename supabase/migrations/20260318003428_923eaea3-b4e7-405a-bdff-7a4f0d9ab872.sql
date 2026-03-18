
-- Fix search_path for compute_trust_score
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
SET search_path = public
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
