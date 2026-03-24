
-- Platform Incidents table
CREATE TABLE IF NOT EXISTS public.platform_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  affected_system text,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incidents"
  ON public.platform_incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- KYC Control RPC
CREATE OR REPLACE FUNCTION public.manage_kyc_list(
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'items', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT k.id, k.user_id, k.status::text, k.submitted_at, k.reviewed_at, k.reviewed_by,
               k.rejection_reason, k.metadata, k.created_at,
               p.email, p.username, p.display_name, p.avatar_url
        FROM kyc_verifications k LEFT JOIN profiles p ON p.id = k.user_id
        WHERE (p_status IS NULL OR k.status::text = p_status)
        ORDER BY k.created_at DESC LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json),
    'stats', (
      SELECT json_build_object(
        'total', count(*),
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'submitted', count(*) FILTER (WHERE status = 'submitted'),
        'approved', count(*) FILTER (WHERE status = 'approved'),
        'rejected', count(*) FILTER (WHERE status = 'rejected')
      ) FROM kyc_verifications
    )
  ) INTO result;
  RETURN result;
END; $$;

-- KYC Update Status RPC
CREATE OR REPLACE FUNCTION public.manage_kyc_update_status(
  p_verification_id uuid, p_new_status text, p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE kyc_verifications SET
    status = p_new_status::kyc_status,
    reviewed_at = CASE WHEN p_new_status IN ('approved','rejected') THEN now() ELSE reviewed_at END,
    reviewed_by = CASE WHEN p_new_status IN ('approved','rejected') THEN auth.uid() ELSE reviewed_by END,
    rejection_reason = COALESCE(p_reason, rejection_reason),
    updated_at = now()
  WHERE id = p_verification_id;
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_data)
  VALUES ('kyc_status_change', 'kyc_verification', p_verification_id::text, auth.uid(),
    jsonb_build_object('new_status', p_new_status, 'reason', p_reason));
END; $$;

-- Payments Overview RPC
CREATE OR REPLACE FUNCTION public.manage_payments_overview(
  p_status text DEFAULT NULL, p_limit int DEFAULT 100, p_offset int DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'subscriptions', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT bs.id, bs.user_id, bs.provider, bs.provider_sub_id, bs.plan_id, bs.status,
               bs.current_period_end, bs.created_at, p.email, p.username, p.display_name,
               bc.stripe_customer_id, bc.paypal_payer_id
        FROM billing_subscriptions bs
        LEFT JOIN profiles p ON p.id = bs.user_id
        LEFT JOIN billing_customers bc ON bc.user_id = bs.user_id
        WHERE (p_status IS NULL OR bs.status = p_status)
        ORDER BY bs.created_at DESC LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json),
    'stats', (
      SELECT json_build_object(
        'total', count(*), 'active', count(*) FILTER (WHERE status = 'active'),
        'canceled', count(*) FILTER (WHERE status = 'canceled'),
        'past_due', count(*) FILTER (WHERE status = 'past_due'),
        'trialing', count(*) FILTER (WHERE status = 'trialing')
      ) FROM billing_subscriptions
    ),
    'recent_transactions', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT ct.id, ct.user_id, ct.amount, ct.balance_after, ct.transaction_type,
               ct.description, ct.created_at, p.email, p.username
        FROM credit_transactions ct LEFT JOIN profiles p ON p.id = ct.user_id
        ORDER BY ct.created_at DESC LIMIT 50
      ) t
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END; $$;

-- Subscription Action RPC
CREATE OR REPLACE FUNCTION public.manage_subscription_action(
  p_subscription_id uuid, p_action text, p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT status INTO v_old_status FROM billing_subscriptions WHERE id = p_subscription_id;
  IF p_action = 'cancel' THEN
    UPDATE billing_subscriptions SET status = 'canceled' WHERE id = p_subscription_id;
  ELSIF p_action = 'reactivate' THEN
    UPDATE billing_subscriptions SET status = 'active' WHERE id = p_subscription_id;
  ELSIF p_action = 'mark_past_due' THEN
    UPDATE billing_subscriptions SET status = 'past_due' WHERE id = p_subscription_id;
  ELSE RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_data, old_data)
  VALUES ('subscription_' || p_action, 'billing_subscription', p_subscription_id::text, auth.uid(),
    jsonb_build_object('action', p_action, 'reason', p_reason),
    jsonb_build_object('old_status', v_old_status));
END; $$;

-- AI Usage Stats RPC
CREATE OR REPLACE FUNCTION public.manage_ai_usage_stats(p_days int DEFAULT 30, p_limit int DEFAULT 50)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result json; cutoff timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'image_stats', (
      SELECT json_build_object('total', count(*), 'completed', count(*) FILTER (WHERE status = 'completed'),
        'failed', count(*) FILTER (WHERE status = 'failed'), 'pending', count(*) FILTER (WHERE status = 'pending'))
      FROM ai_image_generations WHERE created_at >= cutoff
    ),
    'video_stats', (
      SELECT json_build_object('total', count(*), 'completed', count(*) FILTER (WHERE status = 'completed'),
        'failed', count(*) FILTER (WHERE status = 'failed'), 'pending', count(*) FILTER (WHERE status = 'pending'))
      FROM ai_video_generations WHERE created_at >= cutoff
    ),
    'top_users', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT u.user_id, p.email, p.username, u.image_count, u.video_count,
               (u.image_count + u.video_count) as total_generations
        FROM (
          SELECT user_id,
            (SELECT count(*) FROM ai_image_generations img WHERE img.user_id = combined.user_id AND img.created_at >= cutoff) as image_count,
            (SELECT count(*) FROM ai_video_generations vid WHERE vid.user_id = combined.user_id AND vid.created_at >= cutoff) as video_count
          FROM (
            SELECT DISTINCT user_id FROM ai_image_generations WHERE created_at >= cutoff
            UNION SELECT DISTINCT user_id FROM ai_video_generations WHERE created_at >= cutoff
          ) combined
        ) u LEFT JOIN profiles p ON p.id = u.user_id
        ORDER BY (u.image_count + u.video_count) DESC LIMIT p_limit
      ) t
    ), '[]'::json),
    'daily_trend', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT d::date as day,
          (SELECT count(*) FROM ai_image_generations WHERE created_at::date = d::date AND created_at >= cutoff) as images,
          (SELECT count(*) FROM ai_video_generations WHERE created_at::date = d::date AND created_at >= cutoff) as videos
        FROM generate_series(cutoff::date, now()::date, '1 day') d ORDER BY d
      ) t
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END; $$;

-- Incidents List RPC
CREATE OR REPLACE FUNCTION public.manage_incidents_list(p_status text DEFAULT NULL, p_severity text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN COALESCE((
    SELECT json_agg(row_to_json(t)) FROM (
      SELECT i.*, rp.email as reporter_email, rp.username as reporter_username,
             ap.email as assignee_email, ap.username as assignee_username
      FROM platform_incidents i
      LEFT JOIN profiles rp ON rp.id = i.reported_by
      LEFT JOIN profiles ap ON ap.id = i.assigned_to
      WHERE (p_status IS NULL OR i.status = p_status) AND (p_severity IS NULL OR i.severity = p_severity)
      ORDER BY CASE i.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, i.created_at DESC
    ) t
  ), '[]'::json);
END; $$;

-- Incident Upsert RPC
CREATE OR REPLACE FUNCTION public.manage_incident_upsert(
  p_id uuid DEFAULT NULL, p_title text DEFAULT NULL, p_description text DEFAULT NULL,
  p_severity text DEFAULT 'medium', p_status text DEFAULT 'open', p_affected_system text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_id IS NOT NULL THEN
    UPDATE platform_incidents SET title = COALESCE(p_title, title), description = COALESCE(p_description, description),
      severity = p_severity, status = p_status, affected_system = COALESCE(p_affected_system, affected_system),
      updated_at = now(), resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END
    WHERE id = p_id RETURNING id INTO v_id;
  ELSE
    INSERT INTO platform_incidents (title, description, severity, status, affected_system, reported_by)
    VALUES (p_title, p_description, p_severity, p_status, p_affected_system, auth.uid())
    RETURNING id INTO v_id;
  END IF;
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_data)
  VALUES (CASE WHEN p_id IS NOT NULL THEN 'incident_updated' ELSE 'incident_created' END,
    'platform_incident', v_id::text, auth.uid(),
    jsonb_build_object('title', p_title, 'severity', p_severity, 'status', p_status));
  RETURN v_id;
END; $$;

-- Command Center Live Stats RPC
CREATE OR REPLACE FUNCTION public.manage_command_center()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT json_build_object(
    'active_users_24h', (SELECT count(DISTINCT id) FROM profiles WHERE last_seen_at >= now() - interval '24 hours'),
    'active_users_7d', (SELECT count(DISTINCT id) FROM profiles WHERE last_seen_at >= now() - interval '7 days'),
    'total_users', (SELECT count(*) FROM profiles),
    'transactions_today', (SELECT count(*) FROM credit_transactions WHERE created_at >= CURRENT_DATE),
    'transactions_7d', (SELECT count(*) FROM credit_transactions WHERE created_at >= now() - interval '7 days'),
    'revenue_today_cents', COALESCE((SELECT sum(amount) FROM credit_transactions WHERE created_at >= CURRENT_DATE AND transaction_type = 'purchase'), 0),
    'kyc_pending', (SELECT count(*) FROM kyc_verifications WHERE status IN ('pending', 'submitted')),
    'kyc_approved_today', (SELECT count(*) FROM kyc_verifications WHERE status = 'approved' AND reviewed_at >= CURRENT_DATE),
    'active_subscriptions', (SELECT count(*) FROM billing_subscriptions WHERE status = 'active'),
    'past_due_subscriptions', (SELECT count(*) FROM billing_subscriptions WHERE status = 'past_due'),
    'ai_generations_today', (SELECT count(*) FROM ai_image_generations WHERE created_at >= CURRENT_DATE) + (SELECT count(*) FROM ai_video_generations WHERE created_at >= CURRENT_DATE),
    'open_incidents', (SELECT count(*) FROM platform_incidents WHERE status IN ('open', 'investigating')),
    'critical_incidents', (SELECT count(*) FROM platform_incidents WHERE status IN ('open', 'investigating') AND severity = 'critical'),
    'support_pending', (SELECT count(*) FROM support_tickets WHERE status IN ('pending', 'agent_required')),
    'surfaces_published', (SELECT count(DISTINCT surface_id) FROM builder_publishes WHERE state = 'published'),
    'red_alerts', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT id, title, severity, status, affected_system, created_at
        FROM platform_incidents WHERE status IN ('open', 'investigating') AND severity IN ('critical', 'high')
        ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC LIMIT 10
      ) t
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END; $$;
