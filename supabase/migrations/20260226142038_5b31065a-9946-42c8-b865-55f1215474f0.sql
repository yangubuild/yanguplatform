
CREATE OR REPLACE FUNCTION public.builder_delete_section(p_section_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id uuid;
  v_surface_id uuid;
  v_owner_id uuid;
  v_is_admin boolean;
BEGIN
  -- Resolve ownership chain
  SELECT bp.id, bs.id, bs.user_id
    INTO v_page_id, v_surface_id, v_owner_id
    FROM builder_sections bsec
    JOIN builder_pages bp ON bp.id = bsec.page_id
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
   WHERE bsec.id = p_section_id;

  IF v_page_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Section not found');
  END IF;

  -- Check admin via direct user_roles table lookup
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Must be surface owner or admin
  IF auth.uid() <> v_owner_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorised');
  END IF;

  DELETE FROM builder_sections WHERE id = p_section_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
