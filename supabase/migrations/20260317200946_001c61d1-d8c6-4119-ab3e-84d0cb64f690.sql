
-- Analytics RPC: time-series growth data for management analytics
CREATE OR REPLACE FUNCTION public.manage_analytics_overview(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Admin-only guard
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT public.has_role(auth.uid(), 'analyst') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH
  user_series AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS cnt
    FROM auth.users
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY day ORDER BY day
  ),
  surface_series AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS cnt
    FROM surfaces
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY day ORDER BY day
  ),
  domain_series AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS cnt
    FROM domains
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY day ORDER BY day
  ),
  audit_series AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS cnt
    FROM audit_logs
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY day ORDER BY day
  ),
  builder_event_series AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS cnt
    FROM builder_events
    WHERE created_at >= now() - (p_days || ' days')::interval
    GROUP BY day ORDER BY day
  ),
  -- Totals
  totals AS (
    SELECT
      (SELECT count(*) FROM auth.users) AS total_users,
      (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days') AS users_7d,
      (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days') AS users_30d,
      (SELECT count(*) FROM surfaces) AS total_surfaces,
      (SELECT count(*) FROM domains WHERE is_active = true) AS active_domains,
      (SELECT count(*) FROM billing_subscriptions WHERE status = 'active') AS active_subscriptions,
      (SELECT count(*) FROM platform_alerts WHERE is_resolved = false) AS open_alerts,
      (SELECT count(*) FROM builder_events WHERE created_at > now() - interval '7 days') AS builder_events_7d,
      (SELECT count(*) FROM app_user_installs WHERE status = 'active') AS active_app_installs
  )
  SELECT jsonb_build_object(
    'totals', (SELECT row_to_json(t)::jsonb FROM totals t),
    'user_growth', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb) FROM user_series),
    'surface_growth', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb) FROM surface_series),
    'domain_growth', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb) FROM domain_series),
    'audit_activity', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb) FROM audit_series),
    'builder_events', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb) FROM builder_event_series)
  ) INTO result;

  RETURN result;
END;
$$;
