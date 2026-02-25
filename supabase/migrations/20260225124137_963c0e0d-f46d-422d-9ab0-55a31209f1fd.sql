CREATE OR REPLACE FUNCTION public.builder_update_surface(
  p_surface_id uuid,
  p_title text,
  p_description text,
  p_slug text,
  p_metadata jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface builder_surfaces%ROWTYPE;
  v_slug_conflict boolean;
BEGIN
  -- Ownership check
  SELECT * INTO v_surface
  FROM builder_surfaces
  WHERE id = p_surface_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'surface_not_found_or_not_owner');
  END IF;

  -- Slug availability check (only if changing slug)
  IF p_slug IS NOT NULL AND p_slug <> v_surface.slug THEN
    SELECT EXISTS (
      SELECT 1
      FROM builder_surfaces bs
      WHERE bs.user_id = v_surface.user_id
        AND bs.surface_type = v_surface.surface_type
        AND bs.slug = p_slug
        AND bs.id <> v_surface.id
    ) INTO v_slug_conflict;

    IF v_slug_conflict THEN
      RETURN jsonb_build_object('ok', false, 'error', 'slug_not_available');
    END IF;
  END IF;

  UPDATE builder_surfaces
  SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    slug = COALESCE(p_slug, slug),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = now()
  WHERE id = p_surface_id;

  SELECT * INTO v_surface FROM builder_surfaces WHERE id = p_surface_id;

  RETURN jsonb_build_object(
    'ok', true,
    'surface', jsonb_build_object(
      'id', v_surface.id,
      'title', v_surface.title,
      'description', v_surface.description,
      'slug', v_surface.slug,
      'metadata', v_surface.metadata,
      'surface_type', v_surface.surface_type
    )
  );
END;
$$;