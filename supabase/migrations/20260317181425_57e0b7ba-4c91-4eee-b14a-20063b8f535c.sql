
-- Create platform_alerts table for real operational alert tracking
CREATE TABLE public.platform_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'email_dlq', 'publish_failure', 'domain_issue', 'job_stuck', 'payment_failure'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'critical', 'warning', 'info'
  title TEXT NOT NULL,
  detail TEXT,
  source_entity_id TEXT, -- reference to the source row
  source_table TEXT, -- e.g. 'email_send_log', 'surface_publishes'
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write alerts
CREATE POLICY "Admins can view platform alerts"
  ON public.platform_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert platform alerts"
  ON public.platform_alerts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update platform alerts"
  ON public.platform_alerts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_platform_alerts_unresolved ON public.platform_alerts (is_resolved, severity, created_at DESC) WHERE NOT is_resolved;

-- RPC: manage_platform_alerts — returns active alerts + auto-detects issues from email DLQ and failed publishes
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
BEGIN
  -- Check admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Manual/persistent alerts
  SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
  INTO v_manual_alerts
  FROM (
    SELECT id, alert_type, severity, title, detail, source_entity_id, source_table, created_at
    FROM platform_alerts
    WHERE NOT is_resolved
    ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, created_at DESC
    LIMIT 50
  ) a;

  -- Auto-detect: emails stuck in DLQ (last 24h)
  SELECT count(DISTINCT message_id)
  INTO v_email_dlq_count
  FROM email_send_log
  WHERE status = 'dlq'
    AND created_at > now() - interval '24 hours';

  -- Auto-detect: failed publishes
  SELECT count(*)
  INTO v_failed_publishes
  FROM surface_publishes
  WHERE state = 'failed';

  SELECT json_build_object(
    'manual_alerts', v_manual_alerts,
    'auto_detected', json_build_object(
      'email_dlq_24h', v_email_dlq_count,
      'failed_publishes', v_failed_publishes
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- RPC: manage_surfaces_list — list all surfaces with domain info for admin
CREATE OR REPLACE FUNCTION public.manage_surfaces_list()
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

  SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
  INTO result
  FROM (
    SELECT
      su.id,
      su.title,
      su.surface_type,
      su.status,
      su.created_at,
      su.draft_slug,
      o.name as org_name,
      d.host as domain_host
    FROM surfaces su
    LEFT JOIN orgs o ON o.id = su.org_id
    LEFT JOIN domains d ON d.id = su.draft_domain_id
    ORDER BY su.created_at DESC
    LIMIT 200
  ) s;

  RETURN result;
END;
$$;

-- RPC: manage_domains_list — list all domains for admin
CREATE OR REPLACE FUNCTION public.manage_domains_list()
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

  SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json)
  INTO result
  FROM (
    SELECT
      id,
      host,
      domain_type,
      kind,
      is_active,
      platform_key,
      created_at,
      owner_org_id,
      points_to_surface_publish_id
    FROM domains
    ORDER BY created_at DESC
    LIMIT 200
  ) d;

  RETURN result;
END;
$$;
