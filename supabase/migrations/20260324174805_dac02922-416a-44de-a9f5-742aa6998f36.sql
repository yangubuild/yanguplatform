
-- ═══════════════════════════════════════════════════════════
-- PHASE 2 MIGRATION: Surface Moderation, Media, Notifications, 
-- Analytics Export, Command Center Upgrade, User Actions
-- ═══════════════════════════════════════════════════════════

-- ── Add status fields for additional AdminStatusBadge support ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'surface_flag_status') THEN
    CREATE TYPE public.surface_flag_status AS ENUM ('clean','flagged','featured','unpublished');
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_surfaces_moderation
-- Lists published surfaces with moderation data
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_surfaces_moderation(
  p_filter TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(t)
  INTO _result
  FROM (
    SELECT
      bp.id,
      bp.slug,
      bp.state,
      bp.published_at,
      bp.unpublished_at,
      bs.title AS surface_title,
      bs.slug AS surface_slug,
      bs.surface_type,
      bs.cover_image_url,
      bs.user_id,
      bs.org_id,
      d.host AS domain_host,
      p.username,
      p.display_name,
      CASE 
        WHEN bp.unpublished_at IS NOT NULL THEN 'unpublished'
        WHEN bp.state = 'published' THEN 'published'
        ELSE bp.state
      END AS mod_status,
      (bs.cover_image_url IS NOT NULL AND bs.cover_image_url != '') AS has_cover_image
    FROM builder_publishes bp
    JOIN builder_surfaces bs ON bs.id = bp.surface_id
    JOIN domains d ON d.id = bp.domain_id
    LEFT JOIN profiles p ON p.id = bs.user_id
    WHERE (p_filter IS NULL OR 
      CASE 
        WHEN p_filter = 'no_cover' THEN (bs.cover_image_url IS NULL OR bs.cover_image_url = '')
        WHEN p_filter = 'published' THEN bp.state = 'published' AND bp.unpublished_at IS NULL
        WHEN p_filter = 'unpublished' THEN bp.unpublished_at IS NOT NULL
        ELSE TRUE
      END)
    AND (p_search IS NULL OR 
      bs.title ILIKE '%' || p_search || '%' OR 
      bs.slug ILIKE '%' || p_search || '%' OR
      d.host ILIKE '%' || p_search || '%')
    ORDER BY bp.published_at DESC NULLS LAST
    LIMIT 200
  ) t;

  RETURN COALESCE(_result, '[]'::json);
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_surface_action (unpublish/feature/flag)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_surface_action(
  p_publish_id UUID,
  p_action TEXT -- 'unpublish', 'republish'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_action = 'unpublish' THEN
    UPDATE builder_publishes SET unpublished_at = now(), state = 'unpublished', updated_at = now() WHERE id = p_publish_id;
  ELSIF p_action = 'republish' THEN
    UPDATE builder_publishes SET unpublished_at = NULL, state = 'published', updated_at = now() WHERE id = p_publish_id;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'manage_surface_' || p_action, 'builder_publish', p_publish_id::text, jsonb_build_object('action', p_action));

  RETURN 'ok';
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_user_action (suspend/reactivate/force_logout/reset_onboarding)  
-- Extended user moderation actions
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_user_moderation_action(
  p_user_id UUID,
  p_action TEXT -- 'suspend','reactivate','reset_onboarding'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_action = 'suspend' THEN
    UPDATE profiles SET account_status = 'suspended' WHERE id = p_user_id;
  ELSIF p_action = 'reactivate' THEN
    UPDATE profiles SET account_status = 'active' WHERE id = p_user_id;
  ELSIF p_action = 'reset_onboarding' THEN
    UPDATE profiles SET 
      onboarding_completed = false,
      onboarding_step = NULL,
      onboarding_started_at = NULL,
      onboarding_completed_at = NULL,
      account_status = 'verified_pending_onboarding'
    WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'manage_user_' || p_action, 'user', p_user_id::text, jsonb_build_object('action', p_action));

  RETURN 'ok';
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_user_full_lifecycle (single user detail)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_user_full_lifecycle(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = p_user_id),
    'kyc', (SELECT row_to_json(k) FROM kyc_verifications k WHERE k.user_id = p_user_id ORDER BY k.created_at DESC LIMIT 1),
    'subscription', (SELECT row_to_json(s) FROM billing_subscriptions s WHERE s.user_id = p_user_id ORDER BY s.created_at DESC LIMIT 1),
    'roles', (SELECT json_agg(r.role) FROM user_roles r WHERE r.user_id = p_user_id),
    'surfaces_count', (SELECT count(*) FROM builder_surfaces WHERE user_id = p_user_id),
    'ai_images_count', (SELECT count(*) FROM ai_image_generations WHERE user_id = p_user_id),
    'ai_videos_count', (SELECT count(*) FROM ai_video_generations WHERE user_id = p_user_id),
    'support_tickets_count', (SELECT count(*) FROM support_tickets WHERE user_id = p_user_id),
    'recent_audit', (SELECT json_agg(t) FROM (
      SELECT action, entity_type, created_at FROM audit_logs WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10
    ) t)
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_media_list (platform media assets)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_media_list(p_search TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(t)
  INTO _result
  FROM (
    SELECT 
      id, 
      section_key, 
      slot_key, 
      image_url, 
      updated_at
    FROM blog_section_images
    WHERE (p_search IS NULL OR section_key ILIKE '%' || p_search || '%' OR slot_key ILIKE '%' || p_search || '%')
    ORDER BY updated_at DESC
    LIMIT 200
  ) t;

  RETURN COALESCE(_result, '[]'::json);
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_media_update (update a media asset URL)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_media_update(
  p_id UUID,
  p_image_url TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE blog_section_images SET image_url = p_image_url, updated_at = now() WHERE id = p_id;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'manage_media_update', 'blog_section_image', p_id::text, jsonb_build_object('image_url', p_image_url));

  RETURN 'ok';
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_media_delete
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_media_delete(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM blog_section_images WHERE id = p_id;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'manage_media_delete', 'blog_section_image', p_id::text);

  RETURN 'ok';
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_notifications_list (email send log)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_notifications_list(
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if email_send_log exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_send_log') THEN
    SELECT json_agg(t)
    INTO _result
    FROM (
      SELECT DISTINCT ON (message_id) 
        id, message_id, template_name, recipient_email, status, error_message, created_at
      FROM email_send_log
      WHERE message_id IS NOT NULL
        AND (p_status IS NULL OR status = p_status)
      ORDER BY message_id, created_at DESC
      LIMIT p_limit
    ) t;
  ELSE
    _result := '[]'::json;
  END IF;

  RETURN COALESCE(_result, '[]'::json);
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_analytics_investor (investor view with export data)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_analytics_investor(p_days INT DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'revenue_total_cents', COALESCE((SELECT sum(amount) FROM credit_transactions WHERE transaction_type = 'purchase'), 0),
    'revenue_period_cents', COALESCE((SELECT sum(amount) FROM credit_transactions WHERE transaction_type = 'purchase' AND created_at >= now() - (p_days || ' days')::interval), 0),
    'active_users_period', (SELECT count(DISTINCT id) FROM profiles WHERE last_seen_at >= now() - (p_days || ' days')::interval),
    'total_users', (SELECT count(*) FROM profiles),
    'new_users_period', (SELECT count(*) FROM profiles WHERE created_at >= now() - (p_days || ' days')::interval),
    'kyc_total', (SELECT count(*) FROM kyc_verifications),
    'kyc_approved', (SELECT count(*) FROM kyc_verifications WHERE status = 'approved'),
    'kyc_conversion_rate', CASE 
      WHEN (SELECT count(*) FROM kyc_verifications) > 0 
      THEN round((SELECT count(*)::numeric FROM kyc_verifications WHERE status = 'approved') / (SELECT count(*)::numeric FROM kyc_verifications) * 100, 1)
      ELSE 0 
    END,
    'subscriptions_active', (SELECT count(*) FROM billing_subscriptions WHERE status = 'active'),
    'subscriptions_total', (SELECT count(*) FROM billing_subscriptions),
    'subscription_conversion_rate', CASE
      WHEN (SELECT count(*) FROM profiles) > 0
      THEN round((SELECT count(*)::numeric FROM billing_subscriptions WHERE status = 'active') / (SELECT count(*)::numeric FROM profiles) * 100, 1)
      ELSE 0
    END,
    'surfaces_total', (SELECT count(*) FROM builder_surfaces),
    'surfaces_published', (SELECT count(*) FROM builder_publishes WHERE state = 'published' AND unpublished_at IS NULL),
    'daily_revenue', (
      SELECT json_agg(t) FROM (
        SELECT date_trunc('day', created_at)::date AS day, sum(amount) AS cents
        FROM credit_transactions
        WHERE transaction_type = 'purchase' AND created_at >= now() - (p_days || ' days')::interval
        GROUP BY 1 ORDER BY 1
      ) t
    ),
    'daily_signups', (
      SELECT json_agg(t) FROM (
        SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
        FROM profiles
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY 1 ORDER BY 1
      ) t
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_command_center_v2 (upgraded with clickable links)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_command_center_v2()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'active_users_24h', (SELECT count(DISTINCT id) FROM profiles WHERE last_seen_at >= now() - interval '24 hours'),
    'active_users_7d', (SELECT count(DISTINCT id) FROM profiles WHERE last_seen_at >= now() - interval '7 days'),
    'total_users', (SELECT count(*) FROM profiles),
    'transactions_today', (SELECT count(*) FROM credit_transactions WHERE created_at >= CURRENT_DATE),
    'transactions_7d', (SELECT count(*) FROM credit_transactions WHERE created_at >= now() - interval '7 days'),
    'revenue_today_cents', COALESCE((SELECT sum(amount) FROM credit_transactions WHERE created_at >= CURRENT_DATE AND transaction_type = 'purchase'), 0),
    'kyc_pending', (SELECT count(*) FROM kyc_verifications WHERE status = 'pending'),
    'kyc_approved_today', (SELECT count(*) FROM kyc_verifications WHERE status = 'approved' AND updated_at >= CURRENT_DATE),
    'active_subscriptions', (SELECT count(*) FROM billing_subscriptions WHERE status = 'active'),
    'past_due_subscriptions', (SELECT count(*) FROM billing_subscriptions WHERE status = 'past_due'),
    'ai_generations_today', (
      (SELECT count(*) FROM ai_image_generations WHERE created_at >= CURRENT_DATE) +
      (SELECT count(*) FROM ai_video_generations WHERE created_at >= CURRENT_DATE)
    ),
    'open_incidents', (SELECT count(*) FROM platform_incidents WHERE status != 'resolved'),
    'critical_incidents', (SELECT count(*) FROM platform_incidents WHERE severity = 'critical' AND status != 'resolved'),
    'support_pending', (SELECT count(*) FROM support_tickets WHERE status IN ('pending','agent_required')),
    'support_escalated', (SELECT count(*) FROM support_tickets WHERE status = 'agent_required'),
    'surfaces_published', (SELECT count(*) FROM builder_publishes WHERE state = 'published' AND unpublished_at IS NULL),
    'surfaces_no_cover', (
      SELECT count(*) FROM builder_publishes bp 
      JOIN builder_surfaces bs ON bs.id = bp.surface_id
      WHERE bp.state = 'published' AND bp.unpublished_at IS NULL 
      AND (bs.cover_image_url IS NULL OR bs.cover_image_url = '')
    ),
    'red_alerts', (
      SELECT COALESCE(json_agg(t), '[]'::json) FROM (
        SELECT id, title, severity, status, affected_system, created_at, 'incident' AS alert_type
        FROM platform_incidents
        WHERE status != 'resolved' AND severity IN ('critical', 'high')
        ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC
        LIMIT 10
      ) t
    ),
    'kyc_alerts', (
      SELECT COALESCE(json_agg(t), '[]'::json) FROM (
        SELECT id, user_id, status, created_at, 'kyc_failure' AS alert_type
        FROM kyc_verifications
        WHERE status = 'rejected' AND created_at >= now() - interval '24 hours'
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    ),
    'payment_alerts', (
      SELECT COALESCE(json_agg(t), '[]'::json) FROM (
        SELECT id, user_id, status, plan_id, created_at, 'payment_issue' AS alert_type
        FROM billing_subscriptions
        WHERE status IN ('past_due', 'canceled') AND created_at >= now() - interval '7 days'
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    ),
    'error_spikes', json_build_object(
      'kyc_rejections_24h', (SELECT count(*) FROM kyc_verifications WHERE status = 'rejected' AND created_at >= now() - interval '24 hours'),
      'failed_payments_24h', (SELECT count(*) FROM billing_subscriptions WHERE status = 'past_due' AND created_at >= now() - interval '24 hours'),
      'ai_errors_24h', (SELECT count(*) FROM ai_image_generations WHERE status = 'error' AND created_at >= now() - interval '24 hours')
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- RPC: manage_support_sla_list (support with SLA timer)
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.manage_support_sla_list(p_status TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(t)
  INTO _result
  FROM (
    SELECT 
      st.*,
      p.username,
      p.display_name,
      p.email,
      p.avatar_url,
      EXTRACT(EPOCH FROM (now() - st.created_at)) / 3600.0 AS hours_since_created,
      CASE 
        WHEN st.status IN ('pending','agent_required') AND EXTRACT(EPOCH FROM (now() - st.created_at)) / 3600.0 > 24 THEN true
        ELSE false
      END AS sla_breached
    FROM support_tickets st
    LEFT JOIN profiles p ON p.id = st.user_id
    WHERE (p_status IS NULL OR st.status = p_status)
    ORDER BY 
      CASE st.status 
        WHEN 'agent_required' THEN 0
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'closed' THEN 4
      END,
      st.created_at ASC
    LIMIT 200
  ) t;

  RETURN COALESCE(_result, '[]'::json);
END;
$$;
