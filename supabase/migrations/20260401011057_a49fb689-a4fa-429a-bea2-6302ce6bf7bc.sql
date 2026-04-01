
-- ============================================================
-- YANGU UNLOCK MATRIX v1 — TIER SYSTEM + FIRST_FREE + DECISION ENGINE
-- ============================================================

-- 1. Add unlock_tier column to unlock_rules
ALTER TABLE public.unlock_rules ADD COLUMN IF NOT EXISTS unlock_tier text DEFAULT 'FREE';
ALTER TABLE public.unlock_rules ADD COLUMN IF NOT EXISTS placement text;
ALTER TABLE public.unlock_rules ADD COLUMN IF NOT EXISTS free_range jsonb;
ALTER TABLE public.unlock_rules ADD COLUMN IF NOT EXISTS module text;

-- 2. First-Free Usage Log (tracks FIRST_FREE per user per action)
CREATE TABLE IF NOT EXISTS public.first_free_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_key text REFERENCES public.unlock_action_registry(action_key) ON DELETE CASCADE NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, action_key)
);

ALTER TABLE public.first_free_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_first_free" ON public.first_free_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_first_free" ON public.first_free_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_first_free_user ON public.first_free_log(user_id);

-- 3. User action usage counter (tracks SOFT_LIMIT counts per period)
CREATE TABLE IF NOT EXISTS public.user_action_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_key text NOT NULL,
  period text DEFAULT 'daily',
  period_start timestamptz DEFAULT date_trunc('day', now()),
  count integer DEFAULT 0,
  UNIQUE(user_id, action_key, period, period_start)
);

ALTER TABLE public.user_action_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_action_counts" ON public.user_action_counts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "system_manage_action_counts" ON public.user_action_counts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_action_counts_user ON public.user_action_counts(user_id, action_key);

-- 4. Expand action registry with ALL matrix actions
INSERT INTO public.unlock_action_registry (action_key, label, category, description) VALUES
  ('profile_post', 'Profile Post', 'social', 'Internal social posting'),
  ('follow_user', 'Follow User', 'social', 'Follow/unfollow'),
  ('like_comment', 'Like/Comment', 'social', 'Like or comment'),
  ('chat_dm', 'Chat/DM', 'social', 'Direct messaging'),
  ('view_feeds', 'View Feeds', 'social', 'View social feeds'),
  ('publish_surface', 'Publish Surface', 'builder', 'Publish a surface'),
  ('schedule_post', 'Schedule Post', 'social_engine', 'Schedule a post'),
  ('create_campaign', 'Create Campaign', 'social_engine', 'Campaign generation'),
  ('batch_generation', 'Batch Generation', 'social_engine', 'Batch content generation'),
  ('generate_ai_shorts', 'Generate AI Shorts', 'ai', 'AI short video generation'),
  ('create_avatar', 'Create Avatar', 'ai', 'AI avatar creation'),
  ('download_ebook', 'Download Ebook', 'downloads', 'Ebook download'),
  ('download_mockup', 'Download Mockup', 'downloads', 'Mockup download'),
  ('export_pdf', 'Export PDF', 'downloads', 'PDF export'),
  ('add_products', 'Add Products', 'commerce', 'Add shop products'),
  ('ada_basic_chat', 'Ada Basic Chat', 'ada', 'Basic AI chat'),
  ('ada_extended', 'Ada Extended Usage', 'ada', 'Extended AI chat session'),
  ('create_workspace', 'Create Workspace', 'workspace', 'Additional workspace'),
  ('custom_domain', 'Custom Domain', 'business', 'Custom domain setup'),
  ('remove_branding', 'Remove Branding', 'business', 'Remove YANGU branding'),
  ('business_tools', 'Business Tools', 'business', 'Business management tools'),
  ('live_selling', 'Live Selling', 'business', 'Live selling feature'),
  ('agency_panel', 'Agency Panel', 'business', 'Agency management')
ON CONFLICT (action_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- 5. Seed unlock rules with matrix tiers
-- A. SOCIAL (FREE)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, is_enabled, notes) VALUES
  ('profile_post', 'FREE', 'social', true, 'Always free - internal social'),
  ('follow_user', 'FREE', 'social', true, 'Always free'),
  ('like_comment', 'FREE', 'social', true, 'Always free'),
  ('chat_dm', 'FREE', 'social', true, 'Always free'),
  ('view_feeds', 'FREE', 'social', true, 'Always free');

-- B. BUILDER (FIRST_FREE + SOFT_LIMIT)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, free_range, ad_required, is_enabled, notes) VALUES
  ('create_surface', 'FIRST_FREE', 'builder', 'extra_surface_creation', null, false, true, 'First surface free'),
  ('publish_surface', 'FIRST_FREE', 'builder', 'extra_surface_creation', null, false, true, 'First publish free');

-- C. SOCIAL ENGINE (SOFT_LIMIT + FLEX)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, free_range, ad_required, is_enabled, notes) VALUES
  ('create_post', 'SOFT_LIMIT', 'social_engine', 'post_action', '{"range": [2, 4, 6]}', true, true, 'Limited free then unlock'),
  ('schedule_post', 'FLEX_UNLOCK', 'social_engine', 'post_action', null, true, true, 'Always monetizable'),
  ('create_campaign', 'FLEX_UNLOCK', 'social_engine', 'post_action', null, true, true, 'High-value action'),
  ('batch_generation', 'HARD_PREMIUM', 'social_engine', 'post_action', null, false, true, 'Credits/subscription only');

-- D. STUDIO AI (FIRST_FREE + SOFT_LIMIT + HARD_PREMIUM)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, credits_required, ad_required, is_enabled, notes) VALUES
  ('generate_ai_image', 'SOFT_LIMIT', 'studio', 'ai_generation', 1, true, true, 'Credit + optional ad'),
  ('generate_ai_video', 'HARD_PREMIUM', 'studio', 'ai_generation', 5, false, true, 'Credits/subscription only'),
  ('generate_ai_shorts', 'SOFT_LIMIT', 'studio', 'ai_generation', 2, false, true, 'Credit-based'),
  ('create_avatar', 'HARD_PREMIUM', 'studio', 'ai_generation', 10, false, true, 'Protect value');

-- E. DOWNLOADS (FIRST_FREE + FLEX)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, ad_required, is_enabled, notes) VALUES
  ('download_asset', 'FIRST_FREE', 'downloads', 'download_action', false, true, 'First download free'),
  ('download_ebook', 'FLEX_UNLOCK', 'downloads', 'download_action', true, true, 'Ad per download'),
  ('download_mockup', 'FLEX_UNLOCK', 'downloads', 'download_action', true, true, 'Ad per download'),
  ('export_pdf', 'FLEX_UNLOCK', 'downloads', 'download_action', true, true, 'Ad per export');

-- F. COMMERCE (SOFT_LIMIT)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, free_range, ad_required, is_enabled, notes) VALUES
  ('add_products', 'SOFT_LIMIT', 'commerce', null, '{"range": [5, 10, 15]}', true, true, 'Free range then unlock');

-- G. ADA AI (FREE + FLEX)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, placement, time_unlock_minutes, is_enabled, notes) VALUES
  ('ada_basic_chat', 'FREE', 'ada', null, null, true, 'Basic chat free'),
  ('ada_extended', 'FLEX_UNLOCK', 'ada', 'modal_unlock', 30, true, 'Time-based unlock');

-- H. SUBSCRIPTION-ONLY (HARD_PREMIUM)
INSERT INTO public.unlock_rules (action_key, unlock_tier, module, payment_required, is_enabled, notes) VALUES
  ('create_workspace', 'HARD_PREMIUM', 'workspace', true, true, 'Subscription only'),
  ('custom_domain', 'HARD_PREMIUM', 'business', true, true, 'Subscription only'),
  ('remove_branding', 'HARD_PREMIUM', 'business', true, true, 'Subscription only'),
  ('business_tools', 'HARD_PREMIUM', 'business', true, true, 'Subscription only'),
  ('live_selling', 'HARD_PREMIUM', 'business', true, true, 'Subscription only'),
  ('agency_panel', 'HARD_PREMIUM', 'business', true, true, 'Subscription only');

-- 6. Enhanced decision engine RPC
CREATE OR REPLACE FUNCTION public.check_unlock_eligibility(p_action_key text, p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule unlock_rules%ROWTYPE;
  v_first_free_used boolean;
  v_usage_count integer;
  v_free_limit integer;
  v_has_subscription boolean;
  v_plan_id text;
BEGIN
  -- Step 0: Find the rule
  SELECT * INTO v_rule
  FROM unlock_rules
  WHERE action_key = p_action_key AND is_enabled = true
  ORDER BY plan_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'no_rule_configured');
  END IF;

  -- Step 1: Is action FREE?
  IF v_rule.unlock_tier = 'FREE' THEN
    RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'always_free', 'rule_id', v_rule.id);
  END IF;

  -- Step 2: Is FIRST_FREE unused?
  IF v_rule.unlock_tier = 'FIRST_FREE' OR v_rule.unlock_tier IN ('SOFT_LIMIT', 'FLEX_UNLOCK') THEN
    SELECT EXISTS(
      SELECT 1 FROM first_free_log WHERE user_id = p_user_id AND action_key = p_action_key
    ) INTO v_first_free_used;

    IF v_rule.unlock_tier = 'FIRST_FREE' AND NOT v_first_free_used THEN
      RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'first_free', 'rule_id', v_rule.id, 'is_first_free', true);
    END IF;
  END IF;

  -- Step 3: Is user within SOFT_LIMIT?
  IF v_rule.unlock_tier = 'SOFT_LIMIT' THEN
    -- Get current period usage
    SELECT COALESCE(c.count, 0) INTO v_usage_count
    FROM user_action_counts c
    WHERE c.user_id = p_user_id
      AND c.action_key = p_action_key
      AND c.period_start = date_trunc('day', now())
    LIMIT 1;

    -- Get free limit from free_range or free_limit
    IF v_rule.free_range IS NOT NULL AND v_rule.free_range ? 'range' THEN
      SELECT (v_rule.free_range->'range'->>0)::integer INTO v_free_limit;
    ELSE
      v_free_limit := COALESCE(v_rule.free_limit, 0);
    END IF;

    IF v_usage_count < v_free_limit THEN
      RETURN jsonb_build_object(
        'decision', 'ALLOW',
        'reason', 'within_soft_limit',
        'rule_id', v_rule.id,
        'used', v_usage_count,
        'limit', v_free_limit
      );
    END IF;
  END IF;

  -- Step 4: Is user paid + within plan?
  SELECT EXISTS(
    SELECT 1 FROM billing_subscriptions bs
    WHERE bs.user_id = p_user_id AND bs.status = 'active'
  ) INTO v_has_subscription;

  IF v_has_subscription THEN
    -- Paid user within plan: no ads
    IF v_rule.plan_limit IS NOT NULL THEN
      SELECT COALESCE(c.count, 0) INTO v_usage_count
      FROM user_action_counts c
      WHERE c.user_id = p_user_id
        AND c.action_key = p_action_key
        AND c.period_start = date_trunc('day', now())
      LIMIT 1;

      IF v_usage_count < v_rule.plan_limit THEN
        RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'within_plan', 'rule_id', v_rule.id);
      ELSE
        RETURN jsonb_build_object('decision', 'PLAN_LIMIT_EXCEEDED', 'reason', 'plan_limit_exceeded', 'rule_id', v_rule.id);
      END IF;
    END IF;

    -- Paid user, no plan_limit set = allow
    IF v_rule.unlock_tier != 'HARD_PREMIUM' OR NOT v_rule.payment_required THEN
      RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'paid_user', 'rule_id', v_rule.id);
    END IF;

    -- HARD_PREMIUM with payment_required = check subscription exists (already confirmed)
    RETURN jsonb_build_object('decision', 'ALLOW', 'reason', 'subscription_active', 'rule_id', v_rule.id);
  END IF;

  -- Step 5: Not paid, limits exceeded → return unlock options
  IF v_rule.unlock_tier = 'HARD_PREMIUM' THEN
    IF v_rule.credits_required IS NOT NULL AND v_rule.credits_required > 0 THEN
      RETURN jsonb_build_object(
        'decision', 'REQUIRE_CREDITS',
        'reason', 'hard_premium_credits',
        'rule_id', v_rule.id,
        'credits_needed', v_rule.credits_required,
        'options', '["use_credits", "upgrade_plan"]'::jsonb
      );
    END IF;
    RETURN jsonb_build_object(
      'decision', 'REQUIRE_PAYMENT',
      'reason', 'hard_premium',
      'rule_id', v_rule.id,
      'options', '["upgrade_plan"]'::jsonb
    );
  END IF;

  -- FLEX_UNLOCK or SOFT_LIMIT exceeded: offer all options
  RETURN jsonb_build_object(
    'decision', CASE
      WHEN v_rule.ad_required THEN 'REQUIRE_AD'
      WHEN v_rule.credits_required IS NOT NULL AND v_rule.credits_required > 0 THEN 'REQUIRE_CREDITS'
      ELSE 'REQUIRE_AD'
    END,
    'reason', 'flex_unlock',
    'rule_id', v_rule.id,
    'credits_needed', v_rule.credits_required,
    'time_unlock_minutes', v_rule.time_unlock_minutes,
    'options', '["watch_ad", "use_credits", "upgrade_plan"]'::jsonb
  );
END;
$$;

-- 7. Mark first-free as used
CREATE OR REPLACE FUNCTION public.mark_first_free_used(p_action_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO first_free_log (user_id, action_key)
  VALUES (auth.uid(), p_action_key)
  ON CONFLICT (user_id, action_key) DO NOTHING;
  RETURN true;
END;
$$;

-- 8. Increment action usage counter
CREATE OR REPLACE FUNCTION public.increment_action_usage(p_action_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  INSERT INTO user_action_counts (user_id, action_key, period, period_start, count)
  VALUES (auth.uid(), p_action_key, 'daily', date_trunc('day', now()), 1)
  ON CONFLICT (user_id, action_key, period, period_start)
  DO UPDATE SET count = user_action_counts.count + 1
  RETURNING count INTO v_new_count;
  RETURN v_new_count;
END;
$$;
