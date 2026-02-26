
-- ============================================================
-- YANGU Builder: core_slot + safe main content switching (v1)
-- Safe migration: minimal backfill + atomic switch + ownership check
-- ============================================================

-- 1) Add core_slot column (idempotent)
ALTER TABLE public.builder_sections
ADD COLUMN IF NOT EXISTS core_slot text DEFAULT NULL;

-- 2) Backfill obvious core sections (safe + idempotent)
UPDATE public.builder_sections
SET core_slot = 'header'
WHERE core_slot IS NULL AND section_type = 'header';

UPDATE public.builder_sections
SET core_slot = 'hero'
WHERE core_slot IS NULL AND section_type = 'hero';

UPDATE public.builder_sections
SET core_slot = 'offer'
WHERE core_slot IS NULL AND section_type = 'offer';

UPDATE public.builder_sections
SET core_slot = 'footer'
WHERE core_slot IS NULL AND section_type = 'footer';

-- 3) Safe backfill for main_content:
UPDATE public.builder_sections
SET core_slot = 'main_content'
WHERE core_slot IS NULL
  AND section_type IN ('menu','products','services','links','about','listings');

-- 4) Atomic RPC: switch main content (owner-only) without hard delete
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
BEGIN
  -- Ownership check (page -> surface -> owner)
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

  -- Find current main content position (prefer core_slot)
  SELECT position
    INTO v_old_position
  FROM public.builder_sections
  WHERE page_id = p_page_id
    AND core_slot = 'main_content'
  ORDER BY position ASC
  LIMIT 1;

  -- If none exists yet, default to position 2 (standard slot)
  IF v_old_position IS NULL THEN
    v_old_position := 2;
  END IF;

  -- Soft-archive any existing main content (preserve data)
  UPDATE public.builder_sections
  SET is_visible = false
  WHERE page_id = p_page_id
    AND core_slot = 'main_content';

  -- Insert new main content at the same position
  INSERT INTO public.builder_sections (page_id, section_type, core_slot, position, schema, is_visible)
  VALUES (p_page_id, p_new_section_type, 'main_content', v_old_position, p_default_schema, true)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'section_id', v_new_id);
END;
$$;
