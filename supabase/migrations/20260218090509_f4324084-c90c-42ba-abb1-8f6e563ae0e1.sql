
-- Add KYC gating to publish eligibility check
-- Shop, store, site, community domains require KYC approved
-- Studio and io are exempt (already blocked from publishing anyway)
CREATE OR REPLACE FUNCTION public._evaluate_publish_eligibility_internal(p_org_id uuid, p_domain_id uuid, p_surface_id uuid, p_user_id uuid)
 RETURNS TABLE(eligible boolean, reasons text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reasons text[] := '{}';
  v_eligible boolean := true;
  v_user_role text;
  v_domain_type text;
  v_surface_exists boolean;
  v_already_published boolean;
  v_active_publish_count integer;
  v_has_subscription boolean;
  v_kyc_status text;
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

  -- 5. KYC GATING for identity-required domain types
  -- shop, store, site, community require KYC approved
  -- studio and io are exempt (already blocked above)
  IF v_domain_type IS NOT NULL AND v_domain_type IN ('shop', 'store', 'site', 'community') THEN
    SELECT kv.status INTO v_kyc_status
    FROM kyc_verifications kv
    WHERE kv.user_id = p_user_id
    ORDER BY kv.created_at DESC
    LIMIT 1;

    IF v_kyc_status IS NULL OR v_kyc_status != 'approved' THEN
      v_eligible := false;
      v_reasons := array_append(v_reasons, 'KYC_REQUIRED');
    END IF;
  END IF;

  -- 6. TRIAL/SUBSCRIPTION GATING
  v_active_publish_count := count_org_active_publishes(p_org_id);
  v_has_subscription := org_has_active_subscription(p_org_id);
  
  IF v_active_publish_count >= 1 AND NOT v_has_subscription THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Free trial allows 1 published surface. Upgrade to publish more.');
  END IF;

  RETURN QUERY SELECT v_eligible, v_reasons;
END;
$function$;
