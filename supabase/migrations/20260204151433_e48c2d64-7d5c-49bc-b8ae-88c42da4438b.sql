-- ============================================================
-- PUBLISH ELIGIBILITY LOGIC WITH TRIAL/SUBSCRIPTION GATING
-- ============================================================
-- Rules:
-- 1. Users can create unlimited surfaces (no gating on creation)
-- 2. First published surface is FREE (trial)
-- 3. Additional published surfaces require active subscription
-- 4. Unpublishing frees the publish slot
-- ============================================================

-- Helper function: Count active publishes for an org
CREATE OR REPLACE FUNCTION public.count_org_active_publishes(p_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM surface_publishes
  WHERE org_id = p_org_id
    AND state = 'published'
    AND unpublished_at IS NULL;
$$;

-- Helper function: Check if org has active subscription
CREATE OR REPLACE FUNCTION public.org_has_active_subscription(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_billing
    WHERE org_id = p_org_id
      AND (
        subscription_status = 'active'
        OR subscription_status = 'trialing'
        OR (trial_active = true AND trial_started_at IS NOT NULL)
      )
  );
$$;

-- Updated: Evaluate publish eligibility with trial/subscription logic
CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(
  p_org_id uuid,
  p_domain_id uuid,
  p_surface_id uuid,
  p_user_id uuid
)
RETURNS TABLE(eligible boolean, reasons text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reasons text[] := '{}';
  v_eligible boolean := true;
  v_user_role text;
  v_domain_type text;
  v_surface_exists boolean;
  v_already_published boolean;
  v_active_publish_count integer;
  v_has_subscription boolean;
BEGIN
  -- 1. Check user has permission (owner/admin in org)
  SELECT role INTO v_user_role
  FROM org_memberships
  WHERE org_id = p_org_id AND user_id = p_user_id;
  
  IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'User does not have publish permission for this organization');
  END IF;

  -- 2. Check surface exists and belongs to org
  SELECT EXISTS (
    SELECT 1 FROM surfaces 
    WHERE id = p_surface_id AND org_id = p_org_id AND archived_at IS NULL
  ) INTO v_surface_exists;
  
  IF NOT v_surface_exists THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Surface not found or does not belong to this organization');
  END IF;

  -- 3. Check domain is valid for publishing (not studio/io)
  SELECT domain_type INTO v_domain_type
  FROM domains
  WHERE id = p_domain_id AND is_active = true;
  
  IF v_domain_type IS NULL THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Domain not found or inactive');
  ELSIF v_domain_type IN ('studio', 'io') THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Publishing to studio or io domains is not supported');
  END IF;

  -- 4. Check if surface is already published on this domain
  SELECT EXISTS (
    SELECT 1 FROM surface_publishes
    WHERE surface_id = p_surface_id 
      AND domain_id = p_domain_id
      AND state = 'published'
      AND unpublished_at IS NULL
  ) INTO v_already_published;
  
  IF v_already_published THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Surface is already published on this domain');
  END IF;

  -- 5. TRIAL/SUBSCRIPTION GATING
  -- Count current active publishes for this org
  v_active_publish_count := count_org_active_publishes(p_org_id);
  
  -- Check if org has active subscription
  v_has_subscription := org_has_active_subscription(p_org_id);
  
  -- If org already has 1+ published surface and no subscription, block
  IF v_active_publish_count >= 1 AND NOT v_has_subscription THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Free trial allows 1 published surface. Upgrade to publish more.');
  END IF;

  RETURN QUERY SELECT v_eligible, v_reasons;
END;
$$;

-- Updated: Request publish surface with trial/subscription enforcement
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
  SELECT * INTO v_eligibility
  FROM evaluate_publish_eligibility(v_org_id, p_domain_id, p_surface_id, v_user_id);
  
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

-- Updated: Unpublish surface (frees the publish slot)
CREATE OR REPLACE FUNCTION public.unpublish_surface(
  p_surface_id uuid,
  p_domain_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_user_role text;
  v_publish_id uuid;
BEGIN
  -- Get org_id from surface
  SELECT org_id INTO v_org_id
  FROM surfaces
  WHERE id = p_surface_id;
  
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Surface not found'
    );
  END IF;

  -- Check user permission
  SELECT role INTO v_user_role
  FROM org_memberships
  WHERE org_id = v_org_id AND user_id = v_user_id;
  
  IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied'
    );
  END IF;

  -- Mark as unpublished (frees the slot for future publishes)
  UPDATE surface_publishes
  SET 
    state = 'unpublished',
    unpublished_at = now()
  WHERE surface_id = p_surface_id
    AND domain_id = p_domain_id
    AND state = 'published'
    AND unpublished_at IS NULL
  RETURNING id INTO v_publish_id;

  IF v_publish_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active publish found for this surface on this domain'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'publish_id', v_publish_id,
    'message', 'Surface unpublished. Publish slot freed.'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.count_org_active_publishes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_publish_eligibility(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_publish_surface(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpublish_surface(uuid, uuid) TO authenticated;