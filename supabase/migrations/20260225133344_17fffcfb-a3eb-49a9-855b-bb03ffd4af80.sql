
-- builder_create_page
CREATE OR REPLACE FUNCTION public.builder_create_page(
  p_surface_id uuid,
  p_slug text,
  p_title text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id uuid;
  v_slug text := lower(trim(p_slug));
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM builder_surfaces WHERE id = p_surface_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  INSERT INTO builder_pages (surface_id, slug, title)
  VALUES (p_surface_id, v_slug, p_title)
  RETURNING id INTO v_page_id;

  RETURN jsonb_build_object('ok', true, 'page', jsonb_build_object(
    'id', v_page_id,
    'slug', v_slug,
    'title', p_title
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_taken');
END;
$$;

-- builder_rename_page
CREATE OR REPLACE FUNCTION public.builder_rename_page(
  p_page_id uuid,
  p_title text,
  p_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text := CASE WHEN p_slug IS NULL THEN NULL ELSE lower(trim(p_slug)) END;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM builder_pages bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = p_page_id AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  UPDATE builder_pages
  SET
    title = COALESCE(p_title, title),
    slug  = COALESCE(v_slug, slug),
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object('ok', true, 'page', jsonb_build_object(
    'id', p_page_id,
    'slug', COALESCE(v_slug, (SELECT slug FROM builder_pages WHERE id = p_page_id)),
    'title', (SELECT title FROM builder_pages WHERE id = p_page_id)
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_taken');
END;
$$;

-- builder_delete_page
CREATE OR REPLACE FUNCTION public.builder_delete_page(
  p_page_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface_id uuid;
  v_page_count int;
BEGIN
  SELECT bp.surface_id INTO v_surface_id
  FROM builder_pages bp
  JOIN builder_surfaces bs ON bs.id = bp.surface_id
  WHERE bp.id = p_page_id AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

  IF v_surface_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT count(*) INTO v_page_count FROM builder_pages WHERE surface_id = v_surface_id;
  IF v_page_count <= 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_delete_last_page');
  END IF;

  DELETE FROM builder_sections WHERE page_id = p_page_id;
  DELETE FROM builder_pages WHERE id = p_page_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
