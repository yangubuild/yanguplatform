-- Fix request_publish_surface to call evaluate_publish_eligibility with correct argument order and types
-- The eligibility function signature is: (p_domain_id uuid, p_org_id uuid, p_slug text, p_surface_id uuid)

CREATE OR REPLACE FUNCTION public.request_publish_surface(
  p_surface_id uuid,
  p_domain_id uuid,
  p_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_eligibility record;
  v_publish_id uuid;
  v_normalized_slug text;
  v_is_primary boolean;
  v_domain_host text;
BEGIN
  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM surfaces
  WHERE id = p_surface_id;
  
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'state', 'blocked',
      'reasons', jsonb_build_array('Surface not found')
    );
  END IF;

  -- Check eligibility (includes trial/subscription check)
  -- FIXED: Call with correct argument order: (p_domain_id, p_org_id, p_slug::text, p_surface_id)
  SELECT * INTO v_eligibility
  FROM evaluate_publish_eligibility(p_domain_id, v_org_id, COALESCE(p_slug, ''), p_surface_id);
  
  IF NOT v_eligibility.eligible THEN
    RETURN jsonb_build_object(
      'success', false,
      'state', 'blocked',
      'reasons', to_jsonb(v_eligibility.reasons)
    );
  END IF;

  -- Normalize slug (lowercase, kebab-case)
  IF p_slug IS NOT NULL AND p_slug != '' THEN
    v_normalized_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]', '-', 'g'));
    v_normalized_slug := regexp_replace(v_normalized_slug, '-+', '-', 'g');
    v_normalized_slug := regexp_replace(v_normalized_slug, '^-|-$', '', 'g');
    v_is_primary := false;
    
    -- Check slug uniqueness on this domain
    IF EXISTS (
      SELECT 1 FROM surface_publishes
      WHERE domain_id = p_domain_id
        AND slug = v_normalized_slug
        AND state = 'published'
        AND unpublished_at IS NULL
        AND surface_id != p_surface_id
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'state', 'blocked',
        'reasons', jsonb_build_array('This URL slug is already taken on this domain')
      );
    END IF;
  ELSE
    -- No slug = primary (root path)
    v_normalized_slug := NULL;
    v_is_primary := true;
    
    -- Check primary uniqueness
    IF EXISTS (
      SELECT 1 FROM surface_publishes
      WHERE domain_id = p_domain_id
        AND is_primary = true
        AND state = 'published'
        AND unpublished_at IS NULL
        AND surface_id != p_surface_id
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'state', 'blocked',
        'reasons', jsonb_build_array('A primary surface is already published on this domain')
      );
    END IF;
  END IF;

  -- Create or update publish record
  INSERT INTO surface_publishes (
    surface_id,
    domain_id,
    org_id,
    slug,
    is_primary,
    state,
    published_at
  )
  VALUES (
    p_surface_id,
    p_domain_id,
    v_org_id,
    v_normalized_slug,
    v_is_primary,
    'published',
    now()
  )
  ON CONFLICT (surface_id, domain_id) 
  WHERE state = 'published' AND unpublished_at IS NULL
  DO UPDATE SET
    slug = EXCLUDED.slug,
    is_primary = EXCLUDED.is_primary,
    published_at = now()
  RETURNING id INTO v_publish_id;

  -- Get domain host for response
  SELECT host INTO v_domain_host FROM domains WHERE id = p_domain_id;

  RETURN jsonb_build_object(
    'success', true,
    'publish_id', v_publish_id,
    'state', 'published',
    'slug', v_normalized_slug,
    'domain', v_domain_host
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.request_publish_surface(uuid, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.request_publish_surface(uuid, uuid, text) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';