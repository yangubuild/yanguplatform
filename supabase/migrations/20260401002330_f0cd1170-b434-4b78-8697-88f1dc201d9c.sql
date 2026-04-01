
-- ============================================================
-- YANGU ADS + UNLOCK SYSTEM FOUNDATION
-- ============================================================

-- 1. Unlock Action Registry
CREATE TABLE public.unlock_action_registry (
  action_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Unlock Rules Config
CREATE TABLE public.unlock_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text REFERENCES public.unlock_action_registry(action_key) ON DELETE CASCADE NOT NULL,
  plan_id text,
  free_limit integer,
  ad_required boolean DEFAULT false,
  credits_required integer,
  payment_required boolean DEFAULT false,
  plan_limit integer,
  time_unlock_minutes integer,
  is_enabled boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Ad Placement Slots
CREATE TABLE public.ad_placement_slots (
  slot_key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  supported_formats text[] DEFAULT '{}',
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Ad Events
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  user_id uuid,
  event_type text NOT NULL,
  placement_slot text,
  provider text,
  campaign_id uuid,
  watch_duration_ms integer,
  device_info jsonb,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- 5. Advertiser Accounts
CREATE TABLE public.advertiser_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  country text,
  contact_name text,
  email text,
  phone text,
  website text,
  linked_surface_id uuid,
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Advertiser KYC
CREATE TABLE public.advertiser_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES public.advertiser_accounts(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  submitted_docs jsonb DEFAULT '{}',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Advertiser Campaigns
CREATE TABLE public.advertiser_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES public.advertiser_accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  campaign_type text DEFAULT 'rewarded_video',
  ad_ids uuid[] DEFAULT '{}',
  target_views integer,
  target_clicks integer,
  delivered_views integer DEFAULT 0,
  delivered_clicks integer DEFAULT 0,
  budget_cents integer,
  spent_cents integer DEFAULT 0,
  billing_status text DEFAULT 'pending',
  country_targets text[] DEFAULT '{}',
  audience_targeting jsonb DEFAULT '{}',
  duration_seconds integer DEFAULT 15,
  start_date timestamptz,
  end_date timestamptz,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Ad Review Queue
CREATE TABLE public.ad_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.advertiser_campaigns(id) ON DELETE SET NULL,
  status text DEFAULT 'pending_review',
  rejection_reason text,
  approval_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 9. Extend existing ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS provider text DEFAULT 'direct';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_format text DEFAULT 'image';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 15;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS cta_url text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS country_targets text[] DEFAULT '{}';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS advertiser_id uuid;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.unlock_action_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placement_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_review_queue ENABLE ROW LEVEL SECURITY;

-- unlock_action_registry
CREATE POLICY "auth_read_action_registry" ON public.unlock_action_registry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_action_registry" ON public.unlock_action_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- unlock_rules
CREATE POLICY "auth_read_unlock_rules" ON public.unlock_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_unlock_rules" ON public.unlock_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ad_placement_slots
CREATE POLICY "auth_read_placement_slots" ON public.ad_placement_slots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_placement_slots" ON public.ad_placement_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ad_events
CREATE POLICY "users_insert_own_ad_events" ON public.ad_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins_read_ad_events" ON public.ad_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- advertiser_accounts
CREATE POLICY "users_read_own_advertiser" ON public.advertiser_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_insert_own_advertiser" ON public.advertiser_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_advertiser" ON public.advertiser_accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- advertiser_kyc
CREATE POLICY "advertiser_read_own_kyc" ON public.advertiser_kyc
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.advertiser_accounts aa WHERE aa.id = advertiser_id AND aa.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "advertiser_insert_own_kyc" ON public.advertiser_kyc
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertiser_accounts aa WHERE aa.id = advertiser_id AND aa.user_id = auth.uid())
  );
CREATE POLICY "admin_manage_advertiser_kyc" ON public.advertiser_kyc
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- advertiser_campaigns
CREATE POLICY "advertiser_read_own_campaigns" ON public.advertiser_campaigns
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.advertiser_accounts aa WHERE aa.id = advertiser_id AND aa.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "advertiser_insert_own_campaigns" ON public.advertiser_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.advertiser_accounts aa WHERE aa.id = advertiser_id AND aa.user_id = auth.uid())
  );
CREATE POLICY "advertiser_update_own_campaigns" ON public.advertiser_campaigns
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.advertiser_accounts aa WHERE aa.id = advertiser_id AND aa.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ad_review_queue (admin only)
CREATE POLICY "admin_manage_ad_review" ON public.ad_review_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ad_events_user ON public.ad_events(user_id);
CREATE INDEX idx_ad_events_type ON public.ad_events(event_type);
CREATE INDEX idx_ad_events_created ON public.ad_events(created_at);
CREATE INDEX idx_ad_events_ad ON public.ad_events(ad_id);
CREATE INDEX idx_advertiser_accounts_user ON public.advertiser_accounts(user_id);
CREATE INDEX idx_advertiser_campaigns_advertiser ON public.advertiser_campaigns(advertiser_id);
CREATE INDEX idx_ad_review_status ON public.ad_review_queue(status);

-- ============================================================
-- RPCs
-- ============================================================

-- Check unlock eligibility for a given action
CREATE OR REPLACE FUNCTION public.check_unlock_eligibility(p_action_key text, p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule unlock_rules%ROWTYPE;
BEGIN
  SELECT * INTO v_rule
  FROM unlock_rules
  WHERE action_key = p_action_key AND is_enabled = true
  ORDER BY plan_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'no_rule_configured');
  END IF;

  IF v_rule.ad_required THEN
    RETURN jsonb_build_object('decision', 'REQUIRE_AD', 'reason', 'ad_required_by_rule', 'rule_id', v_rule.id);
  END IF;

  IF v_rule.credits_required IS NOT NULL AND v_rule.credits_required > 0 THEN
    RETURN jsonb_build_object('decision', 'REQUIRE_CREDITS', 'credits_needed', v_rule.credits_required, 'rule_id', v_rule.id);
  END IF;

  IF v_rule.payment_required THEN
    RETURN jsonb_build_object('decision', 'REQUIRE_PAYMENT', 'rule_id', v_rule.id);
  END IF;

  RETURN jsonb_build_object('decision', 'ALLOW', 'rule_id', v_rule.id);
END;
$$;

-- Record an ad event atomically
CREATE OR REPLACE FUNCTION public.record_ad_event(
  p_event_type text,
  p_ad_id uuid DEFAULT NULL,
  p_placement_slot text DEFAULT NULL,
  p_provider text DEFAULT NULL,
  p_campaign_id uuid DEFAULT NULL,
  p_watch_duration_ms integer DEFAULT NULL,
  p_device_info jsonb DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO ad_events (user_id, event_type, ad_id, placement_slot, provider, campaign_id, watch_duration_ms, device_info, session_id)
  VALUES (auth.uid(), p_event_type, p_ad_id, p_placement_slot, p_provider, p_campaign_id, p_watch_duration_ms, p_device_info, p_session_id)
  RETURNING id INTO v_event_id;

  -- Update delivery counters on advertiser campaign if applicable
  IF p_campaign_id IS NOT NULL AND p_event_type = 'completion' THEN
    UPDATE advertiser_campaigns SET delivered_views = delivered_views + 1 WHERE id = p_campaign_id;
  ELSIF p_campaign_id IS NOT NULL AND p_event_type = 'click' THEN
    UPDATE advertiser_campaigns SET delivered_clicks = delivered_clicks + 1 WHERE id = p_campaign_id;
  END IF;

  RETURN v_event_id;
END;
$$;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.unlock_action_registry (action_key, label, category) VALUES
  ('create_post', 'Create Post', 'content'),
  ('download_asset', 'Download Asset', 'content'),
  ('generate_ai_image', 'Generate AI Image', 'ai'),
  ('generate_ai_video', 'Generate AI Video', 'ai'),
  ('create_surface', 'Create Surface', 'builder'),
  ('create_workspace', 'Create Workspace', 'workspace'),
  ('publish_surface', 'Publish Surface', 'builder'),
  ('premium_download', 'Premium Download', 'content'),
  ('premium_tool_use', 'Premium Tool Use', 'tools')
ON CONFLICT DO NOTHING;

INSERT INTO public.ad_placement_slots (slot_key, label, supported_formats) VALUES
  ('post_action', 'Post Action', '{rewarded_video,image}'),
  ('download_action', 'Download Action', '{rewarded_video}'),
  ('ai_generation', 'AI Generation', '{rewarded_video}'),
  ('surface_creation', 'Surface Creation', '{rewarded_video}'),
  ('workspace_expansion', 'Workspace Expansion', '{rewarded_video}'),
  ('premium_tool_unlock', 'Premium Tool Unlock', '{rewarded_video}'),
  ('popup_unlock', 'Popup Unlock', '{rewarded_video,image}'),
  ('poster_unlock', 'Poster Unlock', '{rewarded_video,image}'),
  ('modal_unlock', 'Modal Unlock', '{rewarded_video,image}')
ON CONFLICT DO NOTHING;
