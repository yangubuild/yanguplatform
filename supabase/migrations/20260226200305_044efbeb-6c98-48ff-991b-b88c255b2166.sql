
-- Update builder_get_editor_state to include core_slot in sections
CREATE OR REPLACE FUNCTION public.builder_get_editor_state(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface jsonb;
  v_pages jsonb;
BEGIN
  SELECT to_jsonb(bs.*) INTO v_surface
  FROM builder_surfaces bs
  WHERE bs.id = p_surface_id AND bs.user_id = auth.uid();

  IF v_surface IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'surface_not_found_or_not_owner');
  END IF;

  SELECT coalesce(jsonb_agg(page_data ORDER BY page_data->>'slug'), '[]'::jsonb)
  INTO v_pages
  FROM (
    SELECT jsonb_build_object(
      'id', bp.id,
      'slug', bp.slug,
      'title', bp.title,
      'sections', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', bsec.id,
            'section_type', bsec.section_type,
            'schema', bsec.schema,
            'position', bsec.position,
            'is_visible', bsec.is_visible,
            'core_slot', bsec.core_slot
          ) ORDER BY bsec.position
        )
        FROM builder_sections bsec
        WHERE bsec.page_id = bp.id
      ), '[]'::jsonb)
    ) AS page_data
    FROM builder_pages bp
    WHERE bp.surface_id = p_surface_id
  ) sub;

  RETURN jsonb_build_object('ok', true, 'surface', v_surface, 'pages', v_pages);
END;
$$;

-- Update builder_upsert_section to accept core_slot
CREATE OR REPLACE FUNCTION public.builder_upsert_section(
  p_page_id uuid,
  p_section_id uuid DEFAULT NULL,
  p_section_type text DEFAULT 'generic',
  p_schema jsonb DEFAULT '{}',
  p_position integer DEFAULT 0,
  p_is_visible boolean DEFAULT true,
  p_core_slot text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_section_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM builder_pages bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = p_page_id AND bs.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'page_not_found_or_not_owner');
  END IF;

  IF p_section_id IS NOT NULL THEN
    UPDATE builder_sections SET
      section_type = p_section_type,
      schema = p_schema,
      position = p_position,
      is_visible = p_is_visible,
      core_slot = COALESCE(p_core_slot, core_slot)
    WHERE id = p_section_id AND page_id = p_page_id;
    v_section_id := p_section_id;
  ELSE
    INSERT INTO builder_sections (page_id, section_type, schema, position, is_visible, core_slot)
    VALUES (p_page_id, p_section_type, p_schema, p_position, p_is_visible, p_core_slot)
    RETURNING id INTO v_section_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'section_id', v_section_id);
END;
$$;
