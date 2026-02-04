-- Add archived_at column to surfaces table
ALTER TABLE public.surfaces
ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

-- Create index for efficient filtering of non-archived surfaces
CREATE INDEX IF NOT EXISTS idx_surfaces_archived_at ON public.surfaces(archived_at);

-- RPC: unpublish_surface - ends active publish without changing state
CREATE OR REPLACE FUNCTION public.unpublish_surface(p_surface_id uuid, p_domain_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_user_role text;
  v_updated_count int;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to unpublish');
  END IF;

  -- Platform admin override
  IF has_role(v_user_id, 'admin') THEN
    v_user_role := 'admin';
  END IF;

  -- Unpublish: only set unpublished_at, leave state unchanged
  UPDATE public.surface_publishes
  SET unpublished_at = now()
  WHERE surface_id = p_surface_id
    AND domain_id = p_domain_id
    AND state = 'published'
    AND unpublished_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active publish found for this surface and domain');
  END IF;

  -- Update surface status to draft
  UPDATE public.surfaces
  SET status = 'draft'
  WHERE id = p_surface_id;

  RETURN jsonb_build_object('success', true, 'message', 'Surface unpublished successfully');
END;
$$;

-- RPC: archive_surface - soft delete by setting archived_at
CREATE OR REPLACE FUNCTION public.archive_surface(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to archive');
  END IF;

  -- Platform admin override
  IF has_role(v_user_id, 'admin') THEN
    v_user_role := 'admin';
  END IF;

  -- Set archived_at
  UPDATE public.surfaces
  SET archived_at = now()
  WHERE id = p_surface_id;

  RETURN jsonb_build_object('success', true, 'message', 'Surface archived successfully');
END;
$$;

-- RPC: unarchive_surface - restore archived surface
CREATE OR REPLACE FUNCTION public.unarchive_surface(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to unarchive');
  END IF;

  -- Platform admin override
  IF has_role(v_user_id, 'admin') THEN
    v_user_role := 'admin';
  END IF;

  -- Clear archived_at
  UPDATE public.surfaces
  SET archived_at = NULL
  WHERE id = p_surface_id;

  RETURN jsonb_build_object('success', true, 'message', 'Surface restored successfully');
END;
$$;

-- RPC: delete_surface - hard delete only if no active publish
CREATE OR REPLACE FUNCTION public.delete_surface(p_surface_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_user_role text;
  v_has_active_publish boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to delete');
  END IF;

  -- Platform admin override
  IF has_role(v_user_id, 'admin') THEN
    v_user_role := 'admin';
  END IF;

  -- Check for active publish
  SELECT EXISTS (
    SELECT 1 FROM public.surface_publishes
    WHERE surface_id = p_surface_id
      AND state = 'published'
      AND unpublished_at IS NULL
  ) INTO v_has_active_publish;

  IF v_has_active_publish THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot delete a live surface. Unpublish it first.',
      'requires_unpublish', true
    );
  END IF;

  -- Delete related records first (cascade manually for safety)
  DELETE FROM public.surface_publishes WHERE surface_id = p_surface_id;
  
  -- Delete the surface
  DELETE FROM public.surfaces WHERE id = p_surface_id;

  RETURN jsonb_build_object('success', true, 'message', 'Surface deleted successfully');
END;
$$;

-- RPC: rename_surface - update surface title
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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate title
  IF p_new_title IS NULL OR TRIM(p_new_title) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Title cannot be empty');
  END IF;

  IF LENGTH(TRIM(p_new_title)) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Title must be 100 characters or less');
  END IF;

  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM public.surfaces
  WHERE id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Check user role in org (must be owner or admin)
  SELECT role INTO v_user_role
  FROM public.org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be owner or admin to rename');
  END IF;

  -- Platform admin override
  IF has_role(v_user_id, 'admin') THEN
    v_user_role := 'admin';
  END IF;

  -- Update title
  UPDATE public.surfaces
  SET title = TRIM(p_new_title)
  WHERE id = p_surface_id;

  RETURN jsonb_build_object('success', true, 'message', 'Surface renamed successfully');
END;
$$;