
-- =============================================
-- YANGU DEVELOPER PLATFORM TABLES
-- =============================================

-- 1) developer_apps
CREATE TABLE public.developer_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their apps"
  ON public.developer_apps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_apps.org_id AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners/admins can insert apps"
  ON public.developer_apps FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = developer_apps.org_id AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin')
    )
  );

CREATE POLICY "Org owners/admins can update apps"
  ON public.developer_apps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_apps.org_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_memberships om
    WHERE om.org_id = developer_apps.org_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  ));

CREATE TRIGGER update_developer_apps_updated_at
  BEFORE UPDATE ON public.developer_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) developer_app_keys
CREATE TABLE public.developer_app_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'dev' CHECK (environment IN ('dev','prod')),
  key_hash text NOT NULL,
  prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
ALTER TABLE public.developer_app_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App owners can manage keys"
  ON public.developer_app_keys FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_keys.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_keys.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

-- 3) developer_app_oauth
CREATE TABLE public.developer_app_oauth (
  app_id uuid PRIMARY KEY REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  redirect_uris text[] DEFAULT '{}',
  scopes text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_app_oauth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App owners can manage oauth"
  ON public.developer_app_oauth FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_oauth.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_oauth.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

CREATE TRIGGER update_developer_app_oauth_updated_at
  BEFORE UPDATE ON public.developer_app_oauth
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) developer_app_webhooks
CREATE TABLE public.developer_app_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_hash text,
  events text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_app_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App owners can manage webhooks"
  ON public.developer_app_webhooks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_webhooks.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_app_webhooks.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

CREATE TRIGGER update_developer_app_webhooks_updated_at
  BEFORE UPDATE ON public.developer_app_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) developer_webhook_deliveries
CREATE TABLE public.developer_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  webhook_id uuid REFERENCES public.developer_app_webhooks(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  http_status int,
  request_body jsonb,
  response_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App owners can view deliveries"
  ON public.developer_webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = developer_webhook_deliveries.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

-- 6) app_store_listings
CREATE TABLE public.app_store_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL UNIQUE REFERENCES public.developer_apps(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  summary text,
  description text,
  icon_url text,
  screenshots text[] DEFAULT '{}',
  pricing_model text DEFAULT 'free',
  review_notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','in_review','approved','rejected','published','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_store_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published listings"
  ON public.app_store_listings FOR SELECT
  USING (status = 'published');

CREATE POLICY "App owners can view own listings"
  ON public.app_store_listings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = app_store_listings.app_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "App owners can manage own listings"
  ON public.app_store_listings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = app_store_listings.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = app_store_listings.app_id
      AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ));

CREATE POLICY "Platform admins can manage all listings"
  ON public.app_store_listings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_store_listings_updated_at
  BEFORE UPDATE ON public.app_store_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) provider_registry
CREATE TABLE public.provider_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  provider_type text NOT NULL,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  config_schema jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled providers"
  ON public.provider_registry FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Platform admins can manage providers"
  ON public.provider_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_provider_registry_updated_at
  BEFORE UPDATE ON public.provider_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RPCs
-- =============================================

-- 1) create_developer_app
CREATE OR REPLACE FUNCTION public.create_developer_app(p_org_id uuid, p_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role IN ('owner','admin')
  ) THEN RAISE EXCEPTION 'Must be org owner or admin'; END IF;
  IF EXISTS (SELECT 1 FROM public.developer_apps WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;
  INSERT INTO public.developer_apps (org_id, owner_user_id, name, slug)
  VALUES (p_org_id, auth.uid(), p_name, p_slug)
  RETURNING id INTO v_id;
  -- Auto-create oauth config row
  INSERT INTO public.developer_app_oauth (app_id) VALUES (v_id);
  RETURN v_id;
END;
$$;

-- 2) create_app_key (with strict environment validation)
CREATE OR REPLACE FUNCTION public.create_app_key(p_app_id uuid, p_environment text DEFAULT 'dev')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plain_key text;
  v_prefix text;
  v_hash text;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_environment NOT IN ('dev','prod') THEN
    RAISE EXCEPTION 'Invalid environment. Must be dev or prod';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = p_app_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ) THEN RAISE EXCEPTION 'Not authorized for this app'; END IF;

  v_plain_key := 'yng_' || p_environment || '_' || replace(gen_random_uuid()::text, '-', '');
  v_prefix := left(v_plain_key, 12) || '...';
  v_hash := encode(sha256(v_plain_key::bytea), 'hex');

  INSERT INTO public.developer_app_keys (app_id, environment, key_hash, prefix)
  VALUES (p_app_id, p_environment, v_hash, v_prefix)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'prefix', v_prefix, 'key', v_plain_key);
END;
$$;

-- 3) rotate_app_key
CREATE OR REPLACE FUNCTION public.rotate_app_key(p_key_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app_id uuid;
  v_env text;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT app_id, environment INTO v_app_id, v_env
  FROM public.developer_app_keys WHERE id = p_key_id AND revoked_at IS NULL;
  IF v_app_id IS NULL THEN RAISE EXCEPTION 'Key not found or already revoked'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = v_app_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  -- Revoke old
  UPDATE public.developer_app_keys SET revoked_at = now() WHERE id = p_key_id;
  -- Create new
  v_result := public.create_app_key(v_app_id, v_env);
  RETURN v_result;
END;
$$;

-- 4) submit_app_listing
CREATE OR REPLACE FUNCTION public.submit_app_listing(p_app_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.developer_apps da
    JOIN public.org_memberships om ON om.org_id = da.org_id
    WHERE da.id = p_app_id AND om.user_id = auth.uid() AND om.role IN ('owner','admin')
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.app_store_listings
  SET status = 'submitted', updated_at = now()
  WHERE app_id = p_app_id AND status IN ('draft','rejected');
  IF NOT FOUND THEN RAISE EXCEPTION 'No draft or rejected listing found for this app'; END IF;
END;
$$;

-- 5) admin_review_app (sets approved/rejected, NOT published)
CREATE OR REPLACE FUNCTION public.admin_review_app(p_listing_id uuid, p_decision text, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;
  UPDATE public.app_store_listings
  SET status = p_decision, review_notes = p_notes, updated_at = now()
  WHERE id = p_listing_id AND status IN ('submitted','in_review');
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found or not in reviewable state'; END IF;
END;
$$;

-- 6) publish_app_listing (separate from review, admin-only)
CREATE OR REPLACE FUNCTION public.publish_app_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.app_store_listings
  SET status = 'published', updated_at = now()
  WHERE id = p_listing_id AND status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing must be approved before publishing'; END IF;
END;
$$;
