-- Update evaluate_publish_eligibility to:
-- 1. Skip KYC for studio/io domains
-- 2. Skip subscription gating for studio/io domains (early return)

CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(p_org_id uuid, p_domain_id uuid, p_surface_id uuid, p_user_id uuid)
 RETURNS TABLE(eligible boolean, reasons text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reasons text[] := '{}';
  v_domain_org_id uuid;
  v_domain_active boolean;
  v_domain_type text;
  v_user_role text;
  v_kyc_status text;
  v_trial_active boolean;
  v_subscription_status text;
  v_published_count int;
  v_has_allow_publish_override boolean;
  v_has_bypass_kyc_override boolean;
  v_requires_kyc boolean;
BEGIN
  -- 1. Check domain belongs to org and is active, get domain_type
  SELECT d.org_id, d.is_active, d.domain_type INTO v_domain_org_id, v_domain_active, v_domain_type
  FROM public.domains d
  WHERE d.id = p_domain_id;

  IF v_domain_org_id IS NULL THEN
    v_reasons := array_append(v_reasons, 'Domain not found');
  ELSIF v_domain_org_id != p_org_id THEN
    v_reasons := array_append(v_reasons, 'Domain does not belong to this organization');
  ELSIF NOT v_domain_active THEN
    v_reasons := array_append(v_reasons, 'Domain is not active');
  END IF;

  -- 2. Check user role in org (must be owner or admin)
  SELECT om.role INTO v_user_role
  FROM public.org_memberships om
  WHERE om.org_id = p_org_id AND om.user_id = p_user_id;

  IF v_user_role IS NULL THEN
    v_reasons := array_append(v_reasons, 'User is not a member of this organization');
  ELSIF v_user_role NOT IN ('owner', 'admin') THEN
    v_reasons := array_append(v_reasons, 'User must be owner or admin to publish');
  END IF;

  -- Studio and IO do NOT consume publish slots (no subscription gate here)
  -- Return early after basic validation checks
  IF v_domain_type IN ('studio', 'io') THEN
    RETURN QUERY
      SELECT (array_length(v_reasons, 1) IS NULL OR array_length(v_reasons, 1) = 0), v_reasons;
    RETURN;
  END IF;

  -- 3. Check for admin overrides (only for domains that require KYC/subscription)
  SELECT EXISTS (
    SELECT 1 FROM public.admin_overrides ao
    WHERE ao.org_id = p_org_id
      AND ao.override_type = 'allow_publish'
      AND ao.enabled = true
      AND (ao.surface_id IS NULL OR ao.surface_id = p_surface_id)
      AND (ao.domain_id IS NULL OR ao.domain_id = p_domain_id)
  ) INTO v_has_allow_publish_override;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_overrides ao
    WHERE ao.org_id = p_org_id
      AND ao.override_type = 'bypass_kyc'
      AND ao.enabled = true
  ) INTO v_has_bypass_kyc_override;

  -- 4. Get billing info
  SELECT ob.kyc_status, ob.trial_active, ob.subscription_status
  INTO v_kyc_status, v_trial_active, v_subscription_status
  FROM public.org_billing ob
  WHERE ob.org_id = p_org_id;

  -- 5. KYC required only for business domains (shop, store, site, community)
  v_requires_kyc := v_domain_type IN ('shop', 'store', 'site', 'community');
  
  IF v_requires_kyc AND NOT v_has_bypass_kyc_override THEN
    IF v_kyc_status IS NULL OR v_kyc_status != 'approved' THEN
      v_reasons := array_append(v_reasons, 'KYC verification required');
    END IF;
  END IF;

  -- 6. Check subscription/trial eligibility (unless allow_publish override exists)
  IF NOT v_has_allow_publish_override THEN
    -- Count currently published surfaces for this org (excluding studio/io)
    SELECT COUNT(*) INTO v_published_count
    FROM public.surface_publishes sp
    JOIN public.domains d ON d.id = sp.domain_id
    WHERE sp.org_id = p_org_id
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL
      AND d.domain_type NOT IN ('studio', 'io');

    -- Rule: first publish free, then trial_active allows more, otherwise need subscription
    IF v_published_count = 0 THEN
      -- First publish is always allowed (free)
      NULL;
    ELSIF v_trial_active = true THEN
      -- Trial active allows additional publishes
      NULL;
    ELSIF v_subscription_status != 'active' THEN
      v_reasons := array_append(v_reasons, 'Active subscription required for additional surfaces');
    END IF;
  END IF;

  -- 7. Content policy check (stub - always passes)
  -- Future: Add content moderation checks here

  -- Return result
  RETURN QUERY SELECT (array_length(v_reasons, 1) IS NULL OR array_length(v_reasons, 1) = 0), v_reasons;
END;
$function$;