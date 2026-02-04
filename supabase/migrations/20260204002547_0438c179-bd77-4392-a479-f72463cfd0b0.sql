-- Update request_publish_surface RPC to reject studio/io domains
-- LOCKED RULE: Surfaces can only publish to shop, store, site, community, live
-- Studio/IO domains do NOT support surface publishing

CREATE OR REPLACE FUNCTION public.request_publish_surface(p_surface_id uuid, p_domain_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_eligible boolean;
  v_reasons text[];
  v_publish_id uuid;
  v_domain_type text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get domain type to check if publishing is allowed
  SELECT d.domain_type INTO v_domain_type
  FROM public.domains d
  WHERE d.id = p_domain_id;

  IF v_domain_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;

  -- LOCKED RULE: studio and io domains do NOT support surface publishing
  -- Studio uses album_slug + album_published for sharing (free)
  IF v_domain_type IN ('studio', 'io') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Studio/IO domains do not support surface publishing. Use Studio album links instead.',
      'reasons', ARRAY['Studio/IO domains do not support surface publishing. Use Studio album links instead.']
    );
  END IF;

  -- Get org_id from surface
  SELECT s.org_id INTO v_org_id
  FROM public.surfaces s
  WHERE s.id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Evaluate eligibility
  SELECT e.eligible, e.reasons INTO v_eligible, v_reasons
  FROM public.evaluate_publish_eligibility(v_org_id, p_domain_id, p_surface_id, v_user_id) e;

  -- Unpublish any existing active publish for this domain/surface
  UPDATE public.surface_publishes
  SET unpublished_at = now()
  WHERE domain_id = p_domain_id
    AND surface_id = p_surface_id
    AND unpublished_at IS NULL;

  IF v_eligible THEN
    -- Insert new publish record
    INSERT INTO public.surface_publishes (org_id, domain_id, surface_id, state, blocked_reasons)
    VALUES (v_org_id, p_domain_id, p_surface_id, 'published', '[]'::jsonb)
    RETURNING id INTO v_publish_id;

    -- Update surface status
    UPDATE public.surfaces
    SET status = 'published'
    WHERE id = p_surface_id;

    RETURN jsonb_build_object(
      'success', true,
      'publish_id', v_publish_id,
      'state', 'published'
    );
  ELSE
    -- Insert blocked record
    INSERT INTO public.surface_publishes (org_id, domain_id, surface_id, state, blocked_reasons)
    VALUES (v_org_id, p_domain_id, p_surface_id, 'blocked', to_jsonb(v_reasons))
    RETURNING id INTO v_publish_id;

    RETURN jsonb_build_object(
      'success', false,
      'publish_id', v_publish_id,
      'state', 'blocked',
      'reasons', v_reasons
    );
  END IF;
END;
$function$;