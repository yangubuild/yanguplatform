
-- builder_duplicate_page: copies a page and all its sections
CREATE OR REPLACE FUNCTION public.builder_duplicate_page(
  p_page_id uuid,
  p_new_title text DEFAULT NULL,
  p_new_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface_id uuid;
  v_old_title text;
  v_old_slug text;
  v_new_page_id uuid;
  v_new_title text;
  v_new_slug text;
  v_section record;
BEGIN
  -- Auth check
  SELECT bp.surface_id, bp.title, bp.slug
  INTO v_surface_id, v_old_title, v_old_slug
  FROM builder_pages bp
  JOIN builder_surfaces bs ON bs.id = bp.surface_id
  WHERE bp.id = p_page_id AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

  IF v_surface_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  v_new_title := COALESCE(p_new_title, v_old_title || ' (Copy)');
  v_new_slug  := COALESCE(p_new_slug, v_old_slug || '-copy-' || substr(gen_random_uuid()::text, 1, 4));

  -- Create duplicate page
  INSERT INTO builder_pages (surface_id, slug, title, metadata)
  SELECT v_surface_id, v_new_slug, v_new_title, metadata
  FROM builder_pages WHERE id = p_page_id
  RETURNING id INTO v_new_page_id;

  -- Copy all sections
  INSERT INTO builder_sections (page_id, section_type, schema, position, is_visible, core_slot)
  SELECT v_new_page_id, section_type, schema, position, is_visible, core_slot
  FROM builder_sections WHERE page_id = p_page_id
  ORDER BY position;

  RETURN jsonb_build_object('ok', true, 'page', jsonb_build_object(
    'id', v_new_page_id,
    'slug', v_new_slug,
    'title', v_new_title
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_taken');
END;
$$;

-- builder_reorder_pages: reorder pages within a surface
CREATE OR REPLACE FUNCTION public.builder_reorder_pages(
  p_surface_id uuid,
  p_ordered_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM builder_surfaces WHERE id = p_surface_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Use metadata->position to store order since builder_pages doesn't have a position column
  -- We'll update updated_at in order so the app can sort by it
  FOR i IN 1..array_length(p_ordered_ids, 1) LOOP
    UPDATE builder_pages
    SET metadata = jsonb_set(COALESCE(metadata, '{}')::jsonb, '{position}', to_jsonb(i - 1)),
        updated_at = now() - ((array_length(p_ordered_ids, 1) - i) * interval '1 second')
    WHERE id = p_ordered_ids[i] AND surface_id = p_surface_id;
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;
