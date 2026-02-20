
-- =============================================
-- PROMPT 2: SCOPES, AI AUTO-REVIEW, APPEALS, INSTALLS
-- With 3 fixes applied
-- =============================================

-- A1) Scope Registry
CREATE TABLE public.developer_scope_registry (
  scope_key text PRIMARY KEY,
  category text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low','medium','high')),
  description text NOT NULL DEFAULT '',
  requires_review boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_scope_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read scopes"
  ON public.developer_scope_registry FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage scopes"
  ON public.developer_scope_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scope_registry_updated_at
  BEFORE UPDATE ON public.developer_scope_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed scopes
INSERT INTO public.developer_scope_registry (scope_key, category, risk_level, description, requires_review) VALUES
  ('identity.read',        'identity',  'low',    'Read basic user profile and org membership', false),
  ('identity.write',       'identity',  'high',   'Modify user or org settings',                true),
  ('studio.media.read',    'studio',    'low',    'Read media assets',                          false),
  ('studio.media.write',   'studio',    'medium', 'Create media assets',                        false),
  ('studio.jobs.read',     'studio',    'low',    'Read generation jobs',                        false),
  ('studio.jobs.write',    'studio',    'medium', 'Create generation jobs via providers',        false),
  ('studio.providers.use', 'studio',    'medium', 'Request provider adapter usage',              false),
  ('ada.commands.read',    'ada',       'low',    'Read available Ada commands',                 false),
  ('ada.commands.execute', 'ada',       'medium', 'Execute approved Ada commands',               false),
  ('publish.surfaces.read','publish',   'low',    'Read surface configurations',                 false),
  ('publish.surfaces.write','publish',  'high',   'Create or update surface configs',            true),
  ('publish.domains.read', 'publish',   'low',    'Read domain configurations',                  false),
  ('publish.widgets.install','publish', 'high',   'Install widgets to a surface',                true),
  ('business.credits.read','business',  'low',    'Read credit balance',                         false),
  ('business.credits.spend','business', 'high',   'Spend user or org credits',                   true),
  ('business.subscriptions.read','business','low', 'Read subscription info',                     false),
  ('business.orders.read', 'business',  'medium', 'Read order data',                             false),
  ('business.orders.write','business',  'high',   'Create or modify orders',                     true),
  ('community.posts.read', 'community', 'low',    'Read community posts',                        false),
  ('community.posts.write','community', 'medium', 'Create community posts',                      false),
  ('community.moderation', 'community', 'high',   'Moderate community content',                  true),
  ('providers.read',       'providers', 'low',    'Read provider registry',                      false),
  ('providers.configure',  'providers', 'high',   'Configure provider registry (admin only)',     true);

-- A2) App Scopes
CREATE TABLE public.developer_app_scopes (
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  scope_key text NOT NULL REFERENCES public.developer_scope_registry(scope_key),
  granted_by uuid,
  granted_at timestamptz,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','granted','denied')),
  notes text,
  PRIMARY KEY (app_id, scope_key)
);
ALTER TABLE public.developer_app_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App owners can view their scopes"
  ON public.developer_app_scopes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_scopes.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "App owners can request scopes"
  ON public.developer_app_scopes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.developer_apps da
      JOIN public.org_memberships om ON om.org_id = da.org_id
      WHERE da.id = developer_app_scopes.app_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
    AND status = 'requested'
  );

CREATE POLICY "Admins can manage all scopes"
  ON public.developer_app_scopes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- A3) Runtime scope check functions
CREATE OR REPLACE FUNCTION public.app_has_scope(p_app_id uuid, p_scope_key text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.developer_app_scopes das
    JOIN public.developer_scope_registry dsr ON dsr.scope_key = das.scope_key
    WHERE das.app_id = p_app_id
      AND das.scope_key = p_scope_key
      AND das.status = 'granted'
      AND dsr.is_enabled = true
  );
$$;

CREATE OR REPLACE FUNCTION public.require_app_scope(p_app_id uuid, p_scope_key text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.app_has_scope(p_app_id, p_scope_key) THEN
    RAISE EXCEPTION 'App % does not have granted scope: %', p_app_id, p_scope_key;
  END IF;
END;
$$;

-- B1) App Installs
CREATE TABLE public.developer_app_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.app_store_listings(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id),
  installed_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'installed' CHECK (status IN ('installed','disabled','uninstalled')),
  installed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_app_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view installs"
  ON public.developer_app_installs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_app_installs.org_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners can manage installs"
  ON public.developer_app_installs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_app_installs.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_app_installs.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Platform admins can manage all installs"
  ON public.developer_app_installs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_installs_updated_at
  BEFORE UPDATE ON public.developer_app_installs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- B2) Surface-level installs
CREATE TABLE public.developer_surface_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id uuid NOT NULL REFERENCES public.developer_app_installs(id) ON DELETE CASCADE,
  surface_id uuid NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_surface_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can manage surface installs"
  ON public.developer_surface_installs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.developer_app_installs dai
    JOIN public.org_memberships om ON om.org_id = dai.org_id
    WHERE dai.id = developer_surface_installs.install_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_app_installs dai
    JOIN public.org_memberships om ON om.org_id = dai.org_id
    WHERE dai.id = developer_surface_installs.install_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Platform admins can manage all surface installs"
  ON public.developer_surface_installs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_surface_installs_updated_at
  BEFORE UPDATE ON public.developer_surface_installs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- C1) Extend app_store_listings status constraint
ALTER TABLE public.app_store_listings
  DROP CONSTRAINT IF EXISTS app_store_listings_status_check;
ALTER TABLE public.app_store_listings
  ADD CONSTRAINT app_store_listings_status_check
  CHECK (status IN (
    'draft','submitted','in_review',
    'auto_approved','auto_rejected','needs_manual_review',
    'approved','rejected','published','suspended',
    'appeal_submitted','in_manual_review'
  ));

-- C2) Review Runs
CREATE TABLE public.app_review_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.app_store_listings(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('auto','manual')),
  decision text NOT NULL CHECK (decision IN ('auto_approved','auto_rejected','needs_manual_review','approved','rejected')),
  score int NOT NULL DEFAULT 0,
  reasons jsonb NOT NULL DEFAULT '[]',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_review_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can view review runs"
  ON public.app_review_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.app_store_listings asl
    JOIN public.developer_apps da ON da.id = asl.app_id
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE asl.id = app_review_runs.listing_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Admins can manage review runs"
  ON public.app_review_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- C3) Auto-review RPC (FIX 1: correct jsonb array building)
CREATE OR REPLACE FUNCTION public.run_auto_review(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_listing record;
  v_app record;
  v_reasons jsonb := '[]'::jsonb;
  v_score int := 100;
  v_decision text;
  v_has_high_risk boolean := false;
  v_run_id uuid;
BEGIN
  -- Only admin or service_role
  IF auth.role() != 'service_role' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin or service_role required';
    END IF;
  END IF;

  SELECT * INTO v_listing FROM public.app_store_listings WHERE id = p_listing_id;
  IF v_listing IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_listing.status != 'submitted' THEN RAISE EXCEPTION 'Listing must be in submitted status'; END IF;

  SELECT * INTO v_app FROM public.developer_apps WHERE id = v_listing.app_id;

  -- Check required fields
  IF v_listing.name IS NULL OR trim(v_listing.name) = '' THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','MISSING_NAME','title','Missing app name','detail','Listing name is required','severity','critical'));
    v_score := v_score - 40;
  END IF;
  IF v_listing.summary IS NULL OR trim(v_listing.summary) = '' THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','MISSING_SUMMARY','title','Missing summary','detail','A short summary is required for store display','severity','high'));
    v_score := v_score - 20;
  END IF;
  IF v_listing.description IS NULL OR trim(v_listing.description) = '' THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','MISSING_DESCRIPTION','title','Missing description','detail','A detailed description helps users understand your app','severity','medium'));
    v_score := v_score - 10;
  END IF;
  IF v_listing.category IS NULL OR trim(v_listing.category) = '' THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','MISSING_CATEGORY','title','Missing category','detail','A category is required for store organization','severity','high'));
    v_score := v_score - 15;
  END IF;
  IF v_listing.icon_url IS NULL OR trim(v_listing.icon_url) = '' THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','MISSING_ICON','title','Missing icon','detail','An icon improves store visibility','severity','medium'));
    v_score := v_score - 5;
  END IF;

  -- Check pricing model
  IF v_listing.pricing_model IS NOT NULL AND v_listing.pricing_model NOT IN ('free','paid','freemium','percent_fee') THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','INVALID_PRICING','title','Invalid pricing model','detail','Pricing model must be: free, paid, freemium, or percent_fee','severity','high'));
    v_score := v_score - 15;
  END IF;

  -- Check high-risk scopes
  SELECT EXISTS (
    SELECT 1 FROM public.developer_app_scopes das
    JOIN public.developer_scope_registry dsr ON dsr.scope_key = das.scope_key
    WHERE das.app_id = v_listing.app_id
      AND das.status = 'requested'
      AND dsr.risk_level = 'high'
  ) INTO v_has_high_risk;

  IF v_has_high_risk THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','HIGH_RISK_SCOPES','title','High-risk permissions requested','detail','This app requests high-risk scopes that require manual review','severity','high'));
    v_score := LEAST(v_score, 50);
  END IF;

  -- Check webhook URLs are https
  IF EXISTS (
    SELECT 1 FROM public.developer_app_webhooks
    WHERE app_id = v_listing.app_id AND is_active = true AND url NOT LIKE 'https://%'
  ) THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('code','INSECURE_WEBHOOK','title','Non-HTTPS webhook','detail','All webhook endpoints must use HTTPS','severity','high'));
    v_score := v_score - 20;
  END IF;

  -- Decision logic
  IF v_score < 40 THEN
    v_decision := 'auto_rejected';
  ELSIF v_has_high_risk OR v_score < 70 THEN
    v_decision := 'needs_manual_review';
  ELSE
    v_decision := 'auto_approved';
  END IF;

  v_score := GREATEST(v_score, 0);

  INSERT INTO public.app_review_runs (listing_id, mode, decision, score, reasons)
  VALUES (p_listing_id, 'auto', v_decision, v_score, v_reasons)
  RETURNING id INTO v_run_id;

  UPDATE public.app_store_listings
  SET status = v_decision, updated_at = now()
  WHERE id = p_listing_id;

  RETURN v_run_id;
END;
$$;

-- C4) Admin set listing review state (FIX 2: no 'published' — use publish_app_listing instead)
CREATE OR REPLACE FUNCTION public.set_listing_review_state(p_listing_id uuid, p_new_state text, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_new_state NOT IN ('in_review','in_manual_review','approved','rejected','suspended') THEN
    RAISE EXCEPTION 'Invalid state: %. Allowed: in_review, in_manual_review, approved, rejected, suspended', p_new_state;
  END IF;

  UPDATE public.app_store_listings
  SET status = p_new_state, review_notes = COALESCE(p_notes, review_notes), updated_at = now()
  WHERE id = p_listing_id;

  IF p_new_state IN ('approved','rejected') THEN
    INSERT INTO public.app_review_runs (listing_id, mode, decision, score, reasons, reviewed_by)
    VALUES (p_listing_id, 'manual', p_new_state, CASE WHEN p_new_state = 'approved' THEN 100 ELSE 0 END, '[]'::jsonb, auth.uid());
  END IF;
END;
$$;

-- D1) Appeals table
CREATE TABLE public.app_review_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.app_store_listings(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  message text NOT NULL,
  evidence_links text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'appeal_submitted' CHECK (status IN ('appeal_submitted','in_manual_review','closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_review_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can view and submit appeals"
  ON public.app_review_appeals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.app_store_listings asl
    JOIN public.developer_apps da ON da.id = asl.app_id
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE asl.id = app_review_appeals.listing_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Listing owners can insert appeals"
  ON public.app_review_appeals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.app_store_listings asl
    JOIN public.developer_apps da ON da.id = asl.app_id
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE asl.id = app_review_appeals.listing_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Admins can manage all appeals"
  ON public.app_review_appeals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_appeals_updated_at
  BEFORE UPDATE ON public.app_review_appeals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- D2) Submit appeal RPC (FIX 3: prevent duplicate open appeals)
CREATE OR REPLACE FUNCTION public.submit_appeal(p_listing_id uuid, p_message text, p_evidence_links text[] DEFAULT '{}')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_listing record;
  v_appeal_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT asl.* INTO v_listing
  FROM public.app_store_listings asl
  JOIN public.developer_apps da ON da.id = asl.app_id
  JOIN public.org_memberships om ON om.org_id = da.org_id
  WHERE asl.id = p_listing_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin');

  IF v_listing IS NULL THEN RAISE EXCEPTION 'Listing not found or access denied'; END IF;

  IF v_listing.status NOT IN ('auto_rejected','rejected') THEN
    RAISE EXCEPTION 'Appeals only allowed for rejected listings';
  END IF;

  -- FIX 3: Prevent duplicate open appeals
  IF EXISTS (
    SELECT 1 FROM public.app_review_appeals
    WHERE listing_id = p_listing_id AND status IN ('appeal_submitted','in_manual_review')
  ) THEN
    RAISE EXCEPTION 'An appeal is already open for this listing';
  END IF;

  INSERT INTO public.app_review_appeals (listing_id, submitted_by, message, evidence_links)
  VALUES (p_listing_id, auth.uid(), p_message, p_evidence_links)
  RETURNING id INTO v_appeal_id;

  UPDATE public.app_store_listings SET status = 'appeal_submitted', updated_at = now()
  WHERE id = p_listing_id;

  RETURN v_appeal_id;
END;
$$;
