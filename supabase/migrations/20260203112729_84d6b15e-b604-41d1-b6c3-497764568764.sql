-- =============================================
-- PHASE 2 STEP 1: Domain-Aware Publish Eligibility Engine
-- =============================================

-- =============================================
-- 1. CREATE TABLES (ordered for dependencies)
-- =============================================

-- A) orgs table
CREATE TABLE public.orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- INSERT: allowed when owner_user_id = auth.uid()
CREATE POLICY "Users can create orgs they own"
  ON public.orgs FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- UPDATE: allowed only for owner or platform admin
CREATE POLICY "Org owners can update their org"
  ON public.orgs FOR UPDATE
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- DELETE: allowed only for owner or platform admin
CREATE POLICY "Org owners can delete their org"
  ON public.orgs FOR DELETE
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- B) org_memberships table
CREATE TABLE public.org_memberships (
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships of their orgs"
  ON public.org_memberships FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners/admins can manage memberships"
  ON public.org_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Now add SELECT policy for orgs (after org_memberships exists)
CREATE POLICY "Users can view orgs they belong to"
  ON public.orgs FOR SELECT
  USING (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_memberships.org_id = orgs.id AND org_memberships.user_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

-- C) domains table (org_id NOT NULL)
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host text UNIQUE NOT NULL,
  domain_type text NOT NULL CHECK (domain_type IN ('io', 'community', 'studio', 'shop', 'store', 'live', 'site')),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active domains"
  ON public.domains FOR SELECT
  USING (is_active = true);

CREATE POLICY "Org owners/admins can manage their domains"
  ON public.domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = domains.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = domains.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- D) surfaces table
CREATE TABLE public.surfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  surface_type text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.surfaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their surfaces"
  ON public.surfaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = surfaces.org_id AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org owners/admins/editors can manage surfaces"
  ON public.surfaces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = surfaces.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = surfaces.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'editor')
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- E) surface_publishes table
CREATE TABLE public.surface_publishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  surface_id uuid NOT NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN ('blocked', 'published')),
  blocked_reasons jsonb DEFAULT '[]'::jsonb,
  published_at timestamptz DEFAULT now(),
  unpublished_at timestamptz NULL
);

ALTER TABLE public.surface_publishes ENABLE ROW LEVEL SECURITY;

-- Only SELECT for org members; writes happen only inside RPC (SECURITY DEFINER)
CREATE POLICY "Org members can view their publish records"
  ON public.surface_publishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = surface_publishes.org_id AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Partial unique index: only one active publish per domain/surface
CREATE UNIQUE INDEX idx_unique_active_publish
  ON public.surface_publishes (domain_id, surface_id)
  WHERE unpublished_at IS NULL;

-- F) org_billing table
CREATE TABLE public.org_billing (
  org_id uuid PRIMARY KEY REFERENCES public.orgs(id) ON DELETE CASCADE,
  kyc_status text NOT NULL DEFAULT 'unverified',
  trial_active boolean DEFAULT false,
  trial_started_at timestamptz NULL,
  subscription_status text NOT NULL DEFAULT 'none',
  plan_tier text NOT NULL DEFAULT 'free',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.org_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their billing"
  ON public.org_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_billing.org_id AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org owners can update billing"
  ON public.org_billing FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_billing.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = org_billing.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Platform admins can manage all billing"
  ON public.org_billing FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_org_billing_updated_at
  BEFORE UPDATE ON public.org_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- G) admin_overrides table (created_by NOT NULL)
CREATE TABLE public.admin_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  domain_id uuid NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  surface_id uuid NULL REFERENCES public.surfaces(id) ON DELETE CASCADE,
  override_type text NOT NULL CHECK (override_type IN ('allow_publish', 'extend_trial', 'bypass_kyc')),
  enabled boolean DEFAULT true,
  reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only platform admins can manage overrides"
  ON public.admin_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. TRIGGERS FOR AUTO-CREATION
-- =============================================

-- Auto-create org_billing when org is created
CREATE OR REPLACE FUNCTION public.create_org_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_billing (org_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_create_billing
  AFTER INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_org_billing();

-- Auto-create owner membership when org is created
CREATE OR REPLACE FUNCTION public.create_org_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_memberships (org_id, user_id, role)
  VALUES (NEW.id, NEW.owner_user_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_create_owner_membership
  AFTER INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_org_owner_membership();

-- =============================================
-- 3. ELIGIBILITY FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.evaluate_publish_eligibility(
  p_org_id uuid,
  p_domain_id uuid,
  p_surface_id uuid,
  p_user_id uuid
)
RETURNS TABLE (eligible boolean, reasons text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reasons text[] := '{}';
  v_domain_org_id uuid;
  v_domain_active boolean;
  v_user_role text;
  v_kyc_status text;
  v_trial_active boolean;
  v_subscription_status text;
  v_published_count int;
  v_has_allow_publish_override boolean;
  v_has_bypass_kyc_override boolean;
BEGIN
  -- 1. Check domain belongs to org and is active
  SELECT d.org_id, d.is_active INTO v_domain_org_id, v_domain_active
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

  -- 3. Check for admin overrides
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

  -- 5. Check KYC (unless bypass_kyc override exists)
  IF NOT v_has_bypass_kyc_override THEN
    IF v_kyc_status IS NULL OR v_kyc_status != 'approved' THEN
      v_reasons := array_append(v_reasons, 'KYC verification required');
    END IF;
  END IF;

  -- 6. Check subscription/trial eligibility (unless allow_publish override exists)
  IF NOT v_has_allow_publish_override THEN
    -- Count currently published surfaces for this org
    SELECT COUNT(*) INTO v_published_count
    FROM public.surface_publishes sp
    WHERE sp.org_id = p_org_id
      AND sp.state = 'published'
      AND sp.unpublished_at IS NULL;

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
$$;

-- =============================================
-- 4. PUBLISH RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.request_publish_surface(
  p_surface_id uuid,
  p_domain_id uuid
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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
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
$$;