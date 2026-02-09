
-- Add draft_slug and draft_domain_id to surfaces table
ALTER TABLE public.surfaces 
  ADD COLUMN IF NOT EXISTS draft_slug text,
  ADD COLUMN IF NOT EXISTS draft_domain_id uuid REFERENCES public.domains(id);

-- Update rename_surface to also manage draft_slug with availability check
CREATE OR REPLACE FUNCTION public.rename_surface(p_surface_id uuid, p_new_title text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_user_role text;
  v_draft_slug text;
  v_draft_domain_id uuid;
  v_slug_available boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_new_title IS NULL OR TRIM(p_new_title) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Title cannot be empty');
  END IF;

  IF LENGTH(TRIM(p_new_title)) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Title must be 100 characters or less');
  END IF;

  -- Get org_id and draft_domain_id from surface
  SELECT org_id, draft_domain_id INTO v_org_id, v_draft_domain_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
    -- Platform admin override
    IF NOT has_role(v_user_id, 'admin') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to rename');
    END IF;
  END IF;

  -- Slugify the new title
  v_draft_slug := lower(regexp_replace(trim(p_new_title), '[^a-z0-9-]', '-', 'g'));
  v_draft_slug := regexp_replace(v_draft_slug, '-+', '-', 'g');
  v_draft_slug := regexp_replace(v_draft_slug, '^-|-$', '', 'g');

  -- Check slug availability if we have a draft_domain_id
  v_slug_available := true;
  IF v_draft_domain_id IS NOT NULL AND v_draft_slug != '' THEN
    v_slug_available := is_slug_available(v_draft_domain_id, v_draft_slug);
  END IF;

  -- Always update title; only update draft_slug if available
  IF v_slug_available THEN
    UPDATE public.surfaces
    SET title = TRIM(p_new_title), draft_slug = v_draft_slug
    WHERE id = p_surface_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Surface renamed successfully', 
      'draft_slug', v_draft_slug, 
      'slug_available', true
    );
  ELSE
    UPDATE public.surfaces
    SET title = TRIM(p_new_title)
    WHERE id = p_surface_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Surface renamed but URL slug is taken', 
      'draft_slug', v_draft_slug, 
      'slug_available', false
    );
  END IF;
END;
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.rename_surface(uuid, text) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
