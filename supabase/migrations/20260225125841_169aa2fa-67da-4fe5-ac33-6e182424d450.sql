CREATE OR REPLACE FUNCTION public.get_builder_community_listings(
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      bs.id AS surface_id,
      bs.title,
      bs.description,
      bs.slug,
      bs.metadata,
      bs.surface_type,
      bp.published_at
    FROM builder_surfaces bs
    INNER JOIN builder_publishes bp
      ON bp.surface_id = bs.id
      AND bp.state = 'published'
    WHERE bs.surface_type = 'community_listing'
      AND (bs.metadata->>'list_on_community')::boolean = true
    ORDER BY bp.published_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  ) t;

  RETURN v_result;
END;
$$;