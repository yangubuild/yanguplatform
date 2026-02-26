
-- A) Backfill core_slot = 'main_content' for existing content sections with NULL core_slot
UPDATE public.builder_sections
SET core_slot = 'main_content'
WHERE core_slot IS NULL
  AND is_visible = true
  AND section_type IN (
    'services','products','menu','listings','about','links',
    'properties','rooms','booking_calendar','programs','tours',
    'team','services_pricing','featured_products','deals','flash_sale',
    'reviews','supplier_catalog','bulk_products','agriculture_produce',
    'manufacturer_products','coaching','courses','live_webinars',
    'workshops','mentorship','resources','discussions',
    'live_stream','live_selling','affiliate_products','media_feed',
    'merch','tips_support','collabs'
  );

-- C) Cleanup orphaned archived main content rows with empty schemas
DELETE FROM public.builder_sections
WHERE is_visible = false
  AND core_slot = 'main_content'
  AND (schema = '{}'::jsonb OR schema IS NULL);

-- B) Replace the RPC to handle both core_slot='main_content' AND NULL core_slot content types
CREATE OR REPLACE FUNCTION public.builder_switch_main_content(
  p_page_id uuid,
  p_new_section_type text,
  p_default_schema jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surface_owner uuid;
  v_old_position integer;
  v_new_id uuid;
  v_content_types text[] := ARRAY[
    'services','products','menu','listings','about','links',
    'properties','rooms','booking_calendar','programs','tours',
    'team','services_pricing','featured_products','deals','flash_sale',
    'reviews','supplier_catalog','bulk_products','agriculture_produce',
    'manufacturer_products','coaching','courses','live_webinars',
    'workshops','mentorship','resources','discussions',
    'live_stream','live_selling','affiliate_products','media_feed',
    'merch','tips_support','collabs'
  ];
BEGIN
  -- Ownership check
  SELECT bs.user_id
    INTO v_surface_owner
  FROM public.builder_pages bp
  JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
  WHERE bp.id = p_page_id;

  IF v_surface_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Page not found');
  END IF;

  IF v_surface_owner <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  -- Find current main content position (wider match: core_slot OR content type with NULL core_slot)
  SELECT position
    INTO v_old_position
  FROM public.builder_sections
  WHERE page_id = p_page_id
    AND is_visible = true
    AND (
      core_slot = 'main_content'
      OR (core_slot IS NULL AND section_type = ANY(v_content_types))
    )
  ORDER BY position ASC
  LIMIT 1;

  IF v_old_position IS NULL THEN
    v_old_position := 2;
  END IF;

  -- Soft-archive ALL matching main content sections (both tagged and untagged)
  UPDATE public.builder_sections
  SET is_visible = false,
      core_slot = 'main_content'  -- also backfill so future switches work
  WHERE page_id = p_page_id
    AND is_visible = true
    AND (
      core_slot = 'main_content'
      OR (core_slot IS NULL AND section_type = ANY(v_content_types))
    );

  -- Insert new main content at the same position
  INSERT INTO public.builder_sections (page_id, section_type, core_slot, position, schema, is_visible)
  VALUES (p_page_id, p_new_section_type, 'main_content', v_old_position, p_default_schema, true)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'section_id', v_new_id);
END;
$$;
