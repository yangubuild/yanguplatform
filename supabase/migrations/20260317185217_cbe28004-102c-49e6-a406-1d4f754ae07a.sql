
-- Enhanced platform alerts RPC: add webhook + job failure detection
CREATE OR REPLACE FUNCTION public.manage_platform_alerts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_manual_alerts JSON;
  v_email_dlq_count INT;
  v_failed_publishes INT;
  v_failed_webhooks INT;
  v_stuck_jobs INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
  INTO v_manual_alerts
  FROM (
    SELECT id, alert_type, severity, title, detail, source_entity_id, source_table, created_at
    FROM platform_alerts
    WHERE NOT is_resolved
    ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, created_at DESC
    LIMIT 50
  ) a;

  SELECT count(DISTINCT message_id)
  INTO v_email_dlq_count
  FROM email_send_log
  WHERE status = 'dlq'
    AND created_at > now() - interval '24 hours';

  SELECT count(*)
  INTO v_failed_publishes
  FROM surface_publishes
  WHERE state = 'failed';

  -- Auto-detect: webhook delivery failures (last 24h)
  SELECT count(*)
  INTO v_failed_webhooks
  FROM developer_webhook_deliveries
  WHERE status = 'failed'
    AND created_at > now() - interval '24 hours';

  -- Auto-detect: stuck sync/processing jobs (status pending/running, run_after > 1h ago)
  SELECT count(*)
  INTO v_stuck_jobs
  FROM (
    SELECT id FROM dropship_order_sync_jobs WHERE status IN ('pending','running') AND run_after < now() - interval '1 hour'
    UNION ALL
    SELECT id FROM dropship_sync_jobs WHERE status IN ('pending','running') AND run_after < now() - interval '1 hour'
    UNION ALL
    SELECT id FROM avatar_training_jobs WHERE status IN ('pending','processing') AND updated_at < now() - interval '1 hour'
  ) stuck;

  SELECT json_build_object(
    'manual_alerts', v_manual_alerts,
    'auto_detected', json_build_object(
      'email_dlq_24h', v_email_dlq_count,
      'failed_publishes', v_failed_publishes,
      'failed_webhooks_24h', v_failed_webhooks,
      'stuck_jobs', v_stuck_jobs
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC to list alerts with filters for the detail page
CREATE OR REPLACE FUNCTION public.manage_alerts_list(
  p_severity TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
  INTO result
  FROM (
    SELECT id, alert_type, severity, title, detail, source_entity_id, source_table,
           is_resolved, resolved_at, resolved_by, created_at
    FROM platform_alerts
    WHERE (p_severity IS NULL OR severity = p_severity)
      AND (p_status IS NULL OR
           (p_status = 'resolved' AND is_resolved = true) OR
           (p_status = 'active' AND is_resolved = false))
    ORDER BY is_resolved ASC,
             CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
             created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) a;

  RETURN result;
END;
$$;

-- RPC to resolve/unresolve an alert
CREATE OR REPLACE FUNCTION public.manage_resolve_alert(
  p_alert_id UUID,
  p_resolve BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE platform_alerts
  SET is_resolved = p_resolve,
      resolved_at = CASE WHEN p_resolve THEN now() ELSE NULL END,
      resolved_by = CASE WHEN p_resolve THEN auth.uid() ELSE NULL END
  WHERE id = p_alert_id;
END;
$$;
