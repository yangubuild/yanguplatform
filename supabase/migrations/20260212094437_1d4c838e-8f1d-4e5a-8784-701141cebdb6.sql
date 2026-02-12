
-- Update can_list_on_community to require an active publish
CREATE OR REPLACE FUNCTION public.can_list_on_community(p_surface_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.surfaces s
    JOIN public.org_memberships om ON om.org_id = s.org_id
    JOIN public.surface_publishes sp ON sp.surface_id = s.id
    WHERE s.id = p_surface_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
      AND s.archived_at IS NULL
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL
  );
END;
$function$;

-- Update list_on_community to return a clear error when not published
CREATE OR REPLACE FUNCTION public.list_on_community(p_surface_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_can boolean;
BEGIN
  v_can := can_list_on_community(p_surface_id);
  IF NOT v_can THEN
    -- Distinguish: is the surface unpublished, or is it a permission issue?
    IF EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = p_surface_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Surface must be published before listing on Community');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Permission denied or surface not found');
    END IF;
  END IF;

  INSERT INTO public.community_listings (surface_id, status, listed_at)
  VALUES (p_surface_id, 'active', now())
  ON CONFLICT (surface_id) DO UPDATE
    SET status = 'active', listed_at = now(), updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
