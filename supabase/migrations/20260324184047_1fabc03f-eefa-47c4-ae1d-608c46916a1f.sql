
-- ═══════════ PART G: AGENCY CORE TABLES ═══════════

CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  region text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on agencies" ON public.agencies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'foot_soldier',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(agency_id, user_id)
);
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on agency_members" ON public.agency_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agency members read own" ON public.agency_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid NOT NULL,
  referred_by_user_id uuid NOT NULL,
  agency_id uuid REFERENCES public.agencies(id),
  source text NOT NULL DEFAULT 'direct',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on referrals" ON public.referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Referrers read own" ON public.referrals FOR SELECT TO authenticated
  USING (referred_by_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  member_user_id uuid NOT NULL,
  referral_id uuid REFERENCES public.referrals(id),
  phase text NOT NULL DEFAULT 'phase_1',
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  triggered_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  payout_id uuid
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on commissions" ON public.commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members read own commissions" ON public.commissions FOR SELECT TO authenticated
  USING (member_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  member_user_id uuid NOT NULL,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  method text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on payouts" ON public.payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';
  ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS source_agency_id uuid REFERENCES public.agencies(id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- ═══════════ PART A: AUTOMATION ENGINE ═══════════

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  last_triggered_at timestamptz,
  trigger_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on automation_rules" ON public.automation_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'success',
  result jsonb DEFAULT '{}'::jsonb,
  error text,
  executed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on automation_executions" ON public.automation_executions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════ PART B: SMART ALERTS ═══════════

CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  metric text NOT NULL,
  current_value numeric,
  threshold_value numeric,
  severity text NOT NULL DEFAULT 'warning',
  message text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on smart_alerts" ON public.smart_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════ RPCs ═══════════

CREATE OR REPLACE FUNCTION public.manage_global_search(p_query text, p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT jsonb_build_object(
    'users', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'type', 'user', 'title', COALESCE(p.display_name, p.username, p.id::text), 'subtitle', p.email)) FROM profiles p WHERE p.display_name ILIKE '%' || p_query || '%' OR p.username ILIKE '%' || p_query || '%' OR p.email ILIKE '%' || p_query || '%' LIMIT p_limit), '[]'::jsonb),
    'surfaces', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'type', 'surface', 'title', s.title, 'subtitle', s.slug)) FROM surfaces s WHERE s.title ILIKE '%' || p_query || '%' OR s.slug ILIKE '%' || p_query || '%' LIMIT p_limit), '[]'::jsonb),
    'incidents', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'type', 'incident', 'title', i.title, 'subtitle', i.severity || ' - ' || i.status)) FROM incidents i WHERE i.title ILIKE '%' || p_query || '%' LIMIT p_limit), '[]'::jsonb),
    'tickets', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'type', 'ticket', 'title', t.subject, 'subtitle', t.status)) FROM support_tickets t WHERE t.subject ILIKE '%' || p_query || '%' LIMIT p_limit), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_quick_suspend_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE profiles SET status = 'suspended', updated_at = now() WHERE id = p_user_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'quick_suspend_user', 'user', p_user_id::text, jsonb_build_object('status', 'suspended'));
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_quick_retry_payment(p_subscription_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE billing_subscriptions SET status = 'retrying', created_at = now() WHERE id = p_subscription_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'quick_retry_payment', 'subscription', p_subscription_id::text, jsonb_build_object('action', 'retry'));
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_quick_retrigger_kyc(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE kyc_verifications SET status = 'not_started', updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'quick_retrigger_kyc', 'kyc', p_user_id::text, jsonb_build_object('action', 'retrigger'));
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_automation_rules_list()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(r) ORDER BY r.created_at DESC) FROM automation_rules r), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_create_automation_rule(
  p_name text, p_description text, p_trigger_type text, p_trigger_config jsonb,
  p_action_type text, p_action_config jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO automation_rules (name, description, trigger_type, trigger_config, action_type, action_config, created_by)
  VALUES (p_name, p_description, p_trigger_type, p_trigger_config, p_action_type, p_action_config, auth.uid())
  RETURNING id INTO v_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'create_automation_rule', 'automation_rule', v_id::text, jsonb_build_object('name', p_name));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_toggle_automation_rule(p_rule_id uuid, p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE automation_rules SET is_enabled = p_enabled, updated_at = now() WHERE id = p_rule_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'toggle_automation_rule', 'automation_rule', p_rule_id::text, jsonb_build_object('enabled', p_enabled));
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_delete_automation_rule(p_rule_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM automation_rules WHERE id = p_rule_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'delete_automation_rule', 'automation_rule', p_rule_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_automation_executions(p_rule_id uuid, p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(e) ORDER BY e.executed_at DESC) FROM (SELECT * FROM automation_executions WHERE rule_id = p_rule_id LIMIT p_limit) e), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_smart_alerts_list(p_resolved boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC) FROM smart_alerts a WHERE a.is_resolved = p_resolved), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_resolve_smart_alert(p_alert_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE smart_alerts SET is_resolved = true, resolved_at = now(), resolved_by = auth.uid() WHERE id = p_alert_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'resolve_smart_alert', 'smart_alert', p_alert_id::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agency_dashboard(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN jsonb_build_object(
    'agency', (SELECT row_to_json(a) FROM agencies a WHERE a.id = p_agency_id),
    'total_members', (SELECT count(*) FROM agency_members WHERE agency_id = p_agency_id AND status = 'active'),
    'total_referrals', (SELECT count(*) FROM referrals WHERE agency_id = p_agency_id),
    'converted_referrals', (SELECT count(*) FROM referrals WHERE agency_id = p_agency_id AND status = 'converted'),
    'total_commissions_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND status = 'paid'), 0),
    'pending_commissions_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = p_agency_id AND status = 'pending'), 0),
    'kyc_completed', (SELECT count(*) FROM referrals r JOIN kyc_verifications k ON k.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND k.status = 'verified'),
    'active_subscribers', (SELECT count(*) FROM referrals r JOIN billing_subscriptions bs ON bs.user_id = r.referred_user_id WHERE r.agency_id = p_agency_id AND bs.status = 'active')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agency_members(p_agency_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid() AND role IN ('agency_admin', 'agency_manager'))) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', am.id, 'user_id', am.user_id, 'role', am.role, 'status', am.status, 'joined_at', am.joined_at,
      'display_name', p.display_name, 'username', p.username, 'avatar_url', p.avatar_url,
      'referral_count', (SELECT count(*) FROM referrals WHERE referred_by_user_id = am.user_id AND agency_id = p_agency_id),
      'commission_total', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE member_user_id = am.user_id AND agency_id = p_agency_id), 0)
    ))
    FROM agency_members am LEFT JOIN profiles p ON p.id = am.user_id WHERE am.agency_id = p_agency_id
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_commissions(p_agency_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(row_to_json(c) ORDER BY c.triggered_at DESC) FROM commissions c WHERE c.agency_id = p_agency_id AND (p_user_id IS NULL OR c.member_user_id = p_user_id) LIMIT 100), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_kyc_status(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.uid() = p_user_id) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((SELECT row_to_json(k)::jsonb FROM kyc_verifications k WHERE k.user_id = p_user_id ORDER BY k.created_at DESC LIMIT 1), '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_referrals(p_agency_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM agency_members WHERE agency_id = p_agency_id AND user_id = auth.uid())) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id, 'referred_user_id', r.referred_user_id, 'referred_by_user_id', r.referred_by_user_id,
      'source', r.source, 'status', r.status, 'created_at', r.created_at,
      'referred_name', COALESCE(p.display_name, p.username)
    ) ORDER BY r.created_at DESC)
    FROM referrals r LEFT JOIN profiles p ON p.id = r.referred_user_id
    WHERE r.agency_id = p_agency_id AND (p_user_id IS NULL OR r.referred_by_user_id = p_user_id) LIMIT 100
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_agencies_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name, 'slug', a.slug, 'status', a.status, 'created_at', a.created_at,
      'total_members', (SELECT count(*) FROM agency_members WHERE agency_id = a.id),
      'total_referrals', (SELECT count(*) FROM referrals WHERE agency_id = a.id),
      'kyc_completed', (SELECT count(*) FROM referrals r2 JOIN kyc_verifications k ON k.user_id = r2.referred_user_id WHERE r2.agency_id = a.id AND k.status = 'verified'),
      'active_subscribers', (SELECT count(*) FROM referrals r3 JOIN billing_subscriptions bs ON bs.user_id = r3.referred_user_id WHERE r3.agency_id = a.id AND bs.status = 'active'),
      'total_revenue_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = a.id), 0),
      'pending_commissions_cents', COALESCE((SELECT sum(amount_cents) FROM commissions WHERE agency_id = a.id AND status = 'pending'), 0)
    ) ORDER BY a.created_at DESC)
    FROM agencies a
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_data_integrity_check()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN jsonb_build_object(
    'duplicate_emails', (SELECT count(*) FROM (SELECT email FROM profiles GROUP BY email HAVING count(*) > 1) d),
    'orphan_subscriptions', (SELECT count(*) FROM billing_subscriptions bs WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = bs.user_id)),
    'invalid_subscriptions', (SELECT count(*) FROM billing_subscriptions WHERE status NOT IN ('active','canceled','past_due','trialing','retrying','paused')),
    'kyc_without_profile', (SELECT count(*) FROM kyc_verifications k WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = k.user_id)),
    'referrals_without_agency', (SELECT count(*) FROM referrals WHERE agency_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agencies a WHERE a.id = referrals.agency_id))
  );
END;
$$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN others THEN NULL;
END $$;
