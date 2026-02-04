-- Update request_publish_surface to accept and validate slug
CREATE OR REPLACE FUNCTION public.request_publish_surface(
  p_surface_id uuid, 
  p_domain_id uuid,
  p_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_eligible boolean;
  v_reasons text[];
  v_publish_id uuid;
  v_domain_type text;
  v_surface_title text;
  v_final_slug text;
  v_slug_exists boolean;
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
  IF v_domain_type IN ('studio', 'io') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Studio/IO domains do not support surface publishing. Use Studio album links instead.',
      'reasons', ARRAY['Studio/IO domains do not support surface publishing. Use Studio album links instead.']
    );
  END IF;

  -- Get org_id and title from surface
  SELECT s.org_id, s.title INTO v_org_id, v_surface_title
  FROM public.surfaces s
  WHERE s.id = p_surface_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Surface not found');
  END IF;

  -- Generate or validate slug
  IF p_slug IS NOT NULL AND TRIM(p_slug) != '' THEN
    -- Use provided slug, normalize it
    v_final_slug := LOWER(TRIM(p_slug));
    -- Basic kebab-case cleanup
    v_final_slug := regexp_replace(v_final_slug, '[^a-z0-9-]', '-', 'g');
    v_final_slug := regexp_replace(v_final_slug, '-+', '-', 'g');
    v_final_slug := TRIM(BOTH '-' FROM v_final_slug);
  ELSE
    -- Generate from surface title
    v_final_slug := LOWER(COALESCE(v_surface_title, 'surface'));
    v_final_slug := regexp_replace(v_final_slug, '[^a-z0-9-]', '-', 'g');
    v_final_slug := regexp_replace(v_final_slug, '-+', '-', 'g');
    v_final_slug := TRIM(BOTH '-' FROM v_final_slug);
    
    -- If empty, use a random suffix
    IF v_final_slug = '' THEN
      v_final_slug := 'surface-' || substring(gen_random_uuid()::text from 1 for 8);
    END IF;
  END IF;

  -- Check if slug already exists for this domain (excluding current surface)
  SELECT EXISTS (
    SELECT 1 FROM public.surface_publishes
    WHERE domain_id = p_domain_id
      AND slug = v_final_slug
      AND surface_id != p_surface_id
      AND unpublished_at IS NULL
  ) INTO v_slug_exists;

  IF v_slug_exists THEN
    -- Append random suffix to make unique
    v_final_slug := v_final_slug || '-' || substring(gen_random_uuid()::text from 1 for 4);
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
    -- Insert new publish record with slug
    INSERT INTO public.surface_publishes (org_id, domain_id, surface_id, state, blocked_reasons, slug, is_primary)
    VALUES (v_org_id, p_domain_id, p_surface_id, 'published', '[]'::jsonb, v_final_slug, false)
    RETURNING id INTO v_publish_id;

    -- Update surface status
    UPDATE public.surfaces
    SET status = 'published'
    WHERE id = p_surface_id;

    RETURN jsonb_build_object(
      'success', true,
      'publish_id', v_publish_id,
      'state', 'published',
      'slug', v_final_slug
    );
  ELSE
    -- Insert blocked record (still with slug for reference)
    INSERT INTO public.surface_publishes (org_id, domain_id, surface_id, state, blocked_reasons, slug, is_primary)
    VALUES (v_org_id, p_domain_id, p_surface_id, 'blocked', to_jsonb(v_reasons), v_final_slug, false)
    RETURNING id INTO v_publish_id;

    RETURN jsonb_build_object(
      'success', false,
      'publish_id', v_publish_id,
      'state', 'blocked',
      'reasons', v_reasons,
      'slug', v_final_slug
    );
  END IF;
END;
$$;