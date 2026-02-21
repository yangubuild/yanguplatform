
-- ============================================================
-- PHASE 3 v6: Yangu App Runtime Platform (all fixes applied)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Rate limit config
CREATE TABLE IF NOT EXISTS public.developer_rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  bucket_key text NOT NULL DEFAULT 'default',
  max_requests integer NOT NULL DEFAULT 100,
  window_seconds integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, bucket_key)
);
ALTER TABLE public.developer_rate_limit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rate limit config"
  ON public.developer_rate_limit_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "App owners can view rate limits"
  ON public.developer_rate_limit_config FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_rate_limit_config.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- Rate limit counters
CREATE TABLE IF NOT EXISTS public.developer_rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  bucket_key text NOT NULL DEFAULT 'default',
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  UNIQUE (app_id, bucket_key, window_start)
);
ALTER TABLE public.developer_rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages rate limit counters"
  ON public.developer_rate_limit_counters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Widget registry
CREATE TABLE IF NOT EXISTS public.developer_widget_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  widget_key text NOT NULL,
  title text NOT NULL,
  description text,
  iframe_url text NOT NULL,
  default_dimensions jsonb DEFAULT '{"width":"100%","height":"400px"}'::jsonb,
  allowed_events text[] DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, widget_key)
);
ALTER TABLE public.developer_widget_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled widgets of published apps"
  ON public.developer_widget_registry FOR SELECT
  USING (is_enabled = true AND EXISTS (
    SELECT 1 FROM public.app_store_listings asl
    WHERE asl.app_id = developer_widget_registry.app_id
      AND asl.status = 'published'
  ));

CREATE POLICY "App owners manage widgets"
  ON public.developer_widget_registry FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_widget_registry.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_widget_registry.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- Widget tokens
CREATE TABLE IF NOT EXISTS public.developer_widget_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  install_id uuid NOT NULL REFERENCES public.developer_app_installs(id) ON DELETE CASCADE,
  surface_id uuid NOT NULL,
  widget_key text NOT NULL,
  org_id uuid NOT NULL REFERENCES public.orgs(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_widget_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view widget tokens"
  ON public.developer_widget_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Key verify log (server-only writes via SECURITY DEFINER)
CREATE TABLE IF NOT EXISTS public.developer_app_key_verify_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES public.developer_apps(id),
  environment text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_app_key_verify_log ENABLE ROW LEVEL SECURITY;
-- NO insert policy: only SECURITY DEFINER functions write here

CREATE POLICY "Admins can read verify logs"
  ON public.developer_app_key_verify_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Provider permissions
CREATE TABLE IF NOT EXISTS public.developer_provider_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  provider_key text NOT NULL REFERENCES public.provider_registry(provider_key),
  is_active boolean NOT NULL DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid,
  UNIQUE (app_id, provider_key)
);
ALTER TABLE public.developer_provider_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage provider permissions"
  ON public.developer_provider_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "App owners can view provider permissions"
  ON public.developer_provider_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_provider_permissions.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- Runtime audit (server-only writes via SECURITY DEFINER)
CREATE TABLE IF NOT EXISTS public.developer_runtime_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_runtime_audit ENABLE ROW LEVEL SECURITY;
-- NO insert policy: only SECURITY DEFINER functions write here

CREATE POLICY "Admins can read runtime audit"
  ON public.developer_runtime_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "App owners can read own audit"
  ON public.developer_runtime_audit FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_runtime_audit.app_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

-- ============================================================
-- 2. ALTER existing tables
-- ============================================================

-- Add widget_key to developer_surface_installs (NOT NULL enforced)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'developer_surface_installs' AND column_name = 'widget_key'
  ) THEN
    ALTER TABLE public.developer_surface_installs ADD COLUMN widget_key text;
    -- Backfill any existing rows with a placeholder so NOT NULL won't fail
    UPDATE public.developer_surface_installs SET widget_key = 'default' WHERE widget_key IS NULL;
    ALTER TABLE public.developer_surface_installs ALTER COLUMN widget_key SET NOT NULL;
  END IF;
END $$;

-- Add webhook retry columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'developer_webhook_deliveries' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.developer_webhook_deliveries
      ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
      ADD COLUMN next_retry_at timestamptz,
      ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- 3a. verify_app_key (SECURITY DEFINER, strict env mapping)
CREATE OR REPLACE FUNCTION public.verify_app_key(p_plain_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_env text;
  v_hash text;
  v_result record;
BEGIN
  IF p_plain_key IS NULL OR length(p_plain_key) < 10 THEN
    INSERT INTO public.developer_app_key_verify_log (app_id, environment, success, failure_reason)
    VALUES (NULL, NULL, false, 'Key too short or null');
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid key format');
  END IF;

  v_prefix := split_part(p_plain_key, '_', 1) || '_' || split_part(p_plain_key, '_', 2) || '_';

  IF v_prefix = 'yng_dev_' THEN
    v_env := 'dev';
  ELSIF v_prefix = 'yng_prod_' THEN
    v_env := 'prod';
  ELSE
    INSERT INTO public.developer_app_key_verify_log (app_id, environment, success, failure_reason)
    VALUES (NULL, NULL, false, 'Unknown key prefix: ' || v_prefix);
    RAISE EXCEPTION 'Invalid key prefix';
  END IF;

  v_hash := encode(extensions.digest(convert_to(p_plain_key, 'utf8'), 'sha256'), 'hex');

  SELECT da.id AS app_id, da.name AS app_name, da.org_id, da.status AS app_status,
         dak.environment, dak.id AS key_id
  INTO v_result
  FROM public.developer_app_keys dak
  JOIN public.developer_apps da ON da.id = dak.app_id
  WHERE dak.key_hash = v_hash
    AND dak.revoked_at IS NULL
    AND dak.environment = CASE WHEN v_env = 'dev' THEN 'development' ELSE 'production' END
    AND da.status = 'active';

  IF NOT FOUND THEN
    INSERT INTO public.developer_app_key_verify_log (app_id, environment, success, failure_reason)
    VALUES (NULL, v_env, false, 'No matching active key');
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or revoked key');
  END IF;

  INSERT INTO public.developer_app_key_verify_log (app_id, environment, success, failure_reason)
  VALUES (v_result.app_id, v_result.environment, true, NULL);

  RETURN jsonb_build_object(
    'valid', true,
    'app_id', v_result.app_id,
    'app_name', v_result.app_name,
    'org_id', v_result.org_id,
    'environment', v_result.environment,
    'key_id', v_result.key_id
  );
END;
$$;

-- 3b. check_and_increment_app_rate_limit (uses window_seconds from config)
CREATE OR REPLACE FUNCTION public.check_and_increment_app_rate_limit(
  p_app_id uuid,
  p_bucket_key text DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config record;
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  SELECT max_requests, window_seconds INTO v_config
  FROM public.developer_rate_limit_config
  WHERE app_id = p_app_id AND bucket_key = p_bucket_key;

  IF NOT FOUND THEN
    v_config := ROW(100, 60);
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / v_config.window_seconds) * v_config.window_seconds
  );

  INSERT INTO public.developer_rate_limit_counters (app_id, bucket_key, window_start, request_count)
  VALUES (p_app_id, p_bucket_key, v_window_start, 1)
  ON CONFLICT (app_id, bucket_key, window_start)
  DO UPDATE SET request_count = developer_rate_limit_counters.request_count + 1
  RETURNING request_count INTO v_current_count;

  IF v_current_count > v_config.max_requests THEN
    INSERT INTO public.developer_runtime_audit (app_id, action, details)
    VALUES (p_app_id, 'rate_limit_exceeded', jsonb_build_object('bucket', p_bucket_key, 'count', v_current_count));
    RETURN jsonb_build_object('allowed', false, 'current', v_current_count, 'limit', v_config.max_requests);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'current', v_current_count, 'limit', v_config.max_requests);
END;
$$;

-- 3c. get_app_runtime_context
CREATE OR REPLACE FUNCTION public.get_app_runtime_context(p_app_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app record;
  v_scopes jsonb;
  v_providers jsonb;
  v_widgets jsonb;
  v_rate_limits jsonb;
BEGIN
  SELECT id, name, org_id, status INTO v_app
  FROM public.developer_apps WHERE id = p_app_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'App not found or inactive');
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('scope_key', das.scope_key, 'status', das.status, 'risk_level', dsr.risk_level)), '[]'::jsonb)
  INTO v_scopes
  FROM public.developer_app_scopes das
  JOIN public.developer_scope_registry dsr ON dsr.scope_key = das.scope_key AND dsr.is_enabled = true
  WHERE das.app_id = p_app_id AND das.status = 'granted';

  SELECT coalesce(jsonb_agg(jsonb_build_object('provider_key', dpp.provider_key, 'is_active', dpp.is_active)), '[]'::jsonb)
  INTO v_providers
  FROM public.developer_provider_permissions dpp
  WHERE dpp.app_id = p_app_id AND dpp.is_active = true;

  SELECT coalesce(jsonb_agg(jsonb_build_object('widget_key', dwr.widget_key, 'title', dwr.title, 'iframe_url', dwr.iframe_url)), '[]'::jsonb)
  INTO v_widgets
  FROM public.developer_widget_registry dwr
  WHERE dwr.app_id = p_app_id AND dwr.is_enabled = true;

  SELECT coalesce(jsonb_agg(jsonb_build_object('bucket_key', rlc.bucket_key, 'max_requests', rlc.max_requests, 'window_seconds', rlc.window_seconds)), '[]'::jsonb)
  INTO v_rate_limits
  FROM public.developer_rate_limit_config rlc
  WHERE rlc.app_id = p_app_id;

  RETURN jsonb_build_object(
    'app', jsonb_build_object('id', v_app.id, 'name', v_app.name, 'org_id', v_app.org_id),
    'scopes', v_scopes,
    'providers', v_providers,
    'widgets', v_widgets,
    'rate_limits', v_rate_limits
  );
END;
$$;

-- 3d. create_widget_install_token (FIXED: correct install_id from dsi.install_id)
CREATE OR REPLACE FUNCTION public.create_widget_install_token(p_surface_install_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_si record;
  v_token text;
BEGIN
  SELECT
    dsi.install_id AS install_id,
    dsi.surface_id,
    dsi.widget_key,
    dai.org_id,
    asl.app_id
  INTO v_si
  FROM public.developer_surface_installs dsi
  JOIN public.developer_app_installs dai ON dai.id = dsi.install_id
  JOIN public.app_store_listings asl ON asl.id = dai.listing_id
  JOIN public.developer_widget_registry dwr
    ON dwr.app_id = asl.app_id
   AND dwr.widget_key = dsi.widget_key
   AND dwr.is_enabled = true
  WHERE dsi.id = p_surface_install_id
    AND dsi.status = 'enabled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Surface install not found or widget not enabled';
  END IF;

  v_token := 'wt_' || encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.developer_widget_tokens (token, app_id, install_id, surface_id, widget_key, org_id, expires_at)
  VALUES (v_token, v_si.app_id, v_si.install_id, v_si.surface_id, v_si.widget_key, v_si.org_id, now() + interval '10 minutes');

  RETURN v_token;
END;
$$;

-- 3e. validate_widget_token
CREATE OR REPLACE FUNCTION public.validate_widget_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tok record;
BEGIN
  SELECT * INTO v_tok
  FROM public.developer_widget_tokens
  WHERE token = p_token AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token expired or not found');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'app_id', v_tok.app_id,
    'install_id', v_tok.install_id,
    'surface_id', v_tok.surface_id,
    'widget_key', v_tok.widget_key,
    'org_id', v_tok.org_id
  );
END;
$$;

-- 3f. rotate_webhook_secret (standardized hashing)
CREATE OR REPLACE FUNCTION public.rotate_webhook_secret(p_webhook_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook record;
  v_new_secret text;
BEGIN
  SELECT daw.* INTO v_webhook
  FROM public.developer_app_webhooks daw
  JOIN public.developer_apps da ON da.id = daw.app_id
  JOIN public.org_memberships om ON om.org_id = da.org_id
  WHERE daw.id = p_webhook_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin');

  IF NOT FOUND THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      SELECT * INTO v_webhook FROM public.developer_app_webhooks WHERE id = p_webhook_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Webhook not found'; END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  v_new_secret := 'whsec_' || encode(extensions.gen_random_bytes(32), 'hex');

  UPDATE public.developer_app_webhooks
  SET secret_hash = encode(extensions.digest(convert_to(v_new_secret, 'utf8'), 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = p_webhook_id;

  INSERT INTO public.developer_runtime_audit (app_id, action, details, performed_by)
  VALUES (v_webhook.app_id, 'webhook_secret_rotated', jsonb_build_object('webhook_id', p_webhook_id), auth.uid());

  RETURN v_new_secret;
END;
$$;

-- 3g. enqueue_webhook_event
CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(
  p_app_id uuid,
  p_event_type text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook record;
  v_delivery_id uuid;
BEGIN
  FOR v_webhook IN
    SELECT id FROM public.developer_app_webhooks
    WHERE app_id = p_app_id AND is_active = true
      AND (events IS NULL OR p_event_type = ANY(events))
  LOOP
    INSERT INTO public.developer_webhook_deliveries (app_id, webhook_id, event_type, request_body, status, retry_count)
    VALUES (p_app_id, v_webhook.id, p_event_type, p_payload, 'pending', 0)
    RETURNING id INTO v_delivery_id;
  END LOOP;

  RETURN v_delivery_id;
END;
$$;

-- 3h. retry_webhook_delivery (includes admin override)
CREATE OR REPLACE FUNCTION public.retry_webhook_delivery(p_delivery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery record;
BEGIN
  SELECT dwd.* INTO v_delivery
  FROM public.developer_webhook_deliveries dwd
  JOIN public.developer_apps da ON da.id = dwd.app_id
  JOIN public.org_memberships om ON om.org_id = da.org_id
  WHERE dwd.id = p_delivery_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin');

  IF NOT FOUND THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      SELECT * INTO v_delivery FROM public.developer_webhook_deliveries WHERE id = p_delivery_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Delivery not found'; END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  UPDATE public.developer_webhook_deliveries
  SET status = 'pending',
      retry_count = v_delivery.retry_count + 1,
      next_retry_at = now() + (power(2, least(v_delivery.retry_count, 6))::integer * interval '1 second')
  WHERE id = p_delivery_id;

  INSERT INTO public.developer_runtime_audit (app_id, action, details, performed_by)
  VALUES (v_delivery.app_id, 'webhook_retry', jsonb_build_object('delivery_id', p_delivery_id, 'attempt', v_delivery.retry_count + 1), auth.uid());
END;
$$;

-- 3i. replay_webhook_delivery (includes admin override)
CREATE OR REPLACE FUNCTION public.replay_webhook_delivery(p_delivery_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery record;
  v_new_id uuid;
BEGIN
  SELECT dwd.* INTO v_delivery
  FROM public.developer_webhook_deliveries dwd
  JOIN public.developer_apps da ON da.id = dwd.app_id
  JOIN public.org_memberships om ON om.org_id = da.org_id
  WHERE dwd.id = p_delivery_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner','admin');

  IF NOT FOUND THEN
    IF public.has_role(auth.uid(), 'admin') THEN
      SELECT * INTO v_delivery FROM public.developer_webhook_deliveries WHERE id = p_delivery_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Delivery not found'; END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied';
    END IF;
  END IF;

  INSERT INTO public.developer_webhook_deliveries (app_id, webhook_id, event_type, request_body, status, retry_count)
  VALUES (v_delivery.app_id, v_delivery.webhook_id, v_delivery.event_type, v_delivery.request_body, 'pending', 0)
  RETURNING id INTO v_new_id;

  INSERT INTO public.developer_runtime_audit (app_id, action, details, performed_by)
  VALUES (v_delivery.app_id, 'webhook_replay', jsonb_build_object('original_id', p_delivery_id, 'new_id', v_new_id), auth.uid());

  RETURN v_new_id;
END;
$$;

-- ============================================================
-- 4. SEED DATA (idempotent)
-- ============================================================

-- Default rate limits
INSERT INTO public.developer_rate_limit_config (app_id, bucket_key, max_requests, window_seconds)
SELECT da.id, 'default', 100, 60
FROM public.developer_apps da
WHERE NOT EXISTS (
  SELECT 1 FROM public.developer_rate_limit_config rlc
  WHERE rlc.app_id = da.id AND rlc.bucket_key = 'default'
);

-- Scope seeds
INSERT INTO public.developer_scope_registry (scope_key, category, description, risk_level, requires_review, is_enabled) VALUES
  ('surface.read', 'surface', 'Read surface data', 'low', false, true),
  ('surface.write', 'surface', 'Write surface data', 'medium', true, true),
  ('user.profile.read', 'user', 'Read user profile', 'low', false, true),
  ('widget.render', 'widget', 'Render widgets on surfaces', 'low', false, true),
  ('widget.events.emit', 'widget', 'Emit events from widgets', 'medium', true, true),
  ('provider.ai.execute', 'provider', 'Execute AI provider calls', 'high', true, true),
  ('webhook.receive', 'webhook', 'Receive webhook events', 'low', false, true),
  ('business.credits.spend', 'business', 'Spend org credits on behalf of user', 'high', true, true)
ON CONFLICT (scope_key) DO NOTHING;
