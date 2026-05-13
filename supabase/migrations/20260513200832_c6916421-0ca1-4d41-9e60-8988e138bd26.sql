
-- =========================================================
-- Yangu Offline Phase 1 — schema, RLS, helpers
-- =========================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.offline_shop_status AS ENUM ('pending','active','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.offline_payout_status AS ENUM ('requested','approved','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS public.offline_app_admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offline_foot_soldiers (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  region TEXT,
  bounty_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offline_foot_soldiers_phone ON public.offline_foot_soldiers(phone);

CREATE TABLE IF NOT EXISTS public.offline_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  location TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  onboarded_by UUID REFERENCES public.offline_foot_soldiers(id) ON DELETE SET NULL,
  status public.offline_shop_status NOT NULL DEFAULT 'pending',
  api_token_hash TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offline_shops_onboarded_by ON public.offline_shops(onboarded_by);
CREATE INDEX IF NOT EXISTS idx_offline_shops_owner_phone ON public.offline_shops(owner_phone);
CREATE INDEX IF NOT EXISTS idx_offline_shops_status ON public.offline_shops(status);

CREATE TABLE IF NOT EXISTS public.offline_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.offline_shops(id) ON DELETE CASCADE,
  client_uuid UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_count INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  photo_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  sync_version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, client_uuid)
);
CREATE INDEX IF NOT EXISTS idx_offline_catalogs_shop ON public.offline_catalogs(shop_id);
CREATE INDEX IF NOT EXISTS idx_offline_catalogs_updated ON public.offline_catalogs(updated_at);

CREATE TABLE IF NOT EXISTS public.offline_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.offline_shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.offline_catalogs(id) ON DELETE SET NULL,
  client_uuid UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  customer_phone TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  occurred_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, client_uuid)
);
CREATE INDEX IF NOT EXISTS idx_offline_sales_shop ON public.offline_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_offline_sales_occurred ON public.offline_sales(occurred_at);

CREATE TABLE IF NOT EXISTS public.offline_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.offline_shops(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offline_sync_log_shop ON public.offline_sync_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_log_received ON public.offline_sync_log(received_at DESC);

CREATE TABLE IF NOT EXISTS public.offline_bounty_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foot_soldier_id UUID NOT NULL REFERENCES public.offline_foot_soldiers(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'mobile_money',
  status public.offline_payout_status NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offline_payouts_fs ON public.offline_bounty_payouts(foot_soldier_id);

CREATE TABLE IF NOT EXISTS public.offline_bounty_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL,
  rate_per_shop NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_per_sale_pct NUMERIC(6,4) NOT NULL DEFAULT 0,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.offline_bounty_rates (tier, rate_per_shop, rate_per_sale_pct)
VALUES
  ('bronze', 2000, 0.0050),
  ('silver', 3000, 0.0075),
  ('gold',   5000, 0.0100)
ON CONFLICT DO NOTHING;

-- =========================================================
-- Helper functions
-- =========================================================

CREATE OR REPLACE FUNCTION public.offline_is_admin(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.offline_app_admins WHERE user_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.offline_is_foot_soldier_for_shop(_uid UUID, _shop UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offline_shops
    WHERE id = _shop AND onboarded_by = _uid
  )
$$;

CREATE OR REPLACE FUNCTION public.offline_is_shop_owner(_uid UUID, _shop UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offline_shops s
    JOIN auth.users u ON u.id = _uid
    WHERE s.id = _shop AND s.owner_phone = u.phone
  )
$$;

CREATE OR REPLACE FUNCTION public.offline_can_access_shop(_uid UUID, _shop UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.offline_is_admin(_uid)
    OR public.offline_is_foot_soldier_for_shop(_uid, _shop)
    OR public.offline_is_shop_owner(_uid, _shop)
$$;

CREATE OR REPLACE FUNCTION public.offline_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_offline_shops_updated ON public.offline_shops;
CREATE TRIGGER trg_offline_shops_updated BEFORE UPDATE ON public.offline_shops
FOR EACH ROW EXECUTE FUNCTION public.offline_touch_updated_at();

DROP TRIGGER IF EXISTS trg_offline_fs_updated ON public.offline_foot_soldiers;
CREATE TRIGGER trg_offline_fs_updated BEFORE UPDATE ON public.offline_foot_soldiers
FOR EACH ROW EXECUTE FUNCTION public.offline_touch_updated_at();

DROP TRIGGER IF EXISTS trg_offline_catalogs_updated ON public.offline_catalogs;
CREATE TRIGGER trg_offline_catalogs_updated BEFORE UPDATE ON public.offline_catalogs
FOR EACH ROW EXECUTE FUNCTION public.offline_touch_updated_at();

DROP TRIGGER IF EXISTS trg_offline_payouts_updated ON public.offline_bounty_payouts;
CREATE TRIGGER trg_offline_payouts_updated BEFORE UPDATE ON public.offline_bounty_payouts
FOR EACH ROW EXECUTE FUNCTION public.offline_touch_updated_at();

-- =========================================================
-- RLS
-- =========================================================

ALTER TABLE public.offline_app_admins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_foot_soldiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_shops           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_catalogs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_bounty_payouts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_bounty_rates    ENABLE ROW LEVEL SECURITY;

-- admins
CREATE POLICY "admin self read" ON public.offline_app_admins
  FOR SELECT TO authenticated USING (public.offline_is_admin(auth.uid()));
CREATE POLICY "admin manage admins" ON public.offline_app_admins
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

-- foot soldiers
CREATE POLICY "fs read self or admin" ON public.offline_foot_soldiers
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.offline_is_admin(auth.uid()));
CREATE POLICY "fs update self" ON public.offline_foot_soldiers
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.offline_is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.offline_is_admin(auth.uid()));
CREATE POLICY "fs insert self" ON public.offline_foot_soldiers
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "fs admin delete" ON public.offline_foot_soldiers
  FOR DELETE TO authenticated USING (public.offline_is_admin(auth.uid()));

-- shops
CREATE POLICY "shop read scoped" ON public.offline_shops
  FOR SELECT TO authenticated USING (
    public.offline_is_admin(auth.uid())
    OR onboarded_by = auth.uid()
    OR owner_phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
  );
CREATE POLICY "shop admin write" ON public.offline_shops
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

-- catalogs / sales / sync_log: shop-scoped read; admin write
CREATE POLICY "catalog read scoped" ON public.offline_catalogs
  FOR SELECT TO authenticated USING (public.offline_can_access_shop(auth.uid(), shop_id));
CREATE POLICY "catalog admin write" ON public.offline_catalogs
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

CREATE POLICY "sales read scoped" ON public.offline_sales
  FOR SELECT TO authenticated USING (public.offline_can_access_shop(auth.uid(), shop_id));
CREATE POLICY "sales admin write" ON public.offline_sales
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

CREATE POLICY "sync_log read scoped" ON public.offline_sync_log
  FOR SELECT TO authenticated USING (
    shop_id IS NULL AND public.offline_is_admin(auth.uid())
    OR (shop_id IS NOT NULL AND public.offline_can_access_shop(auth.uid(), shop_id))
  );
CREATE POLICY "sync_log admin write" ON public.offline_sync_log
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

-- payouts
CREATE POLICY "payout read self or admin" ON public.offline_bounty_payouts
  FOR SELECT TO authenticated USING (
    foot_soldier_id = auth.uid() OR public.offline_is_admin(auth.uid())
  );
CREATE POLICY "payout insert self" ON public.offline_bounty_payouts
  FOR INSERT TO authenticated
  WITH CHECK (foot_soldier_id = auth.uid() OR public.offline_is_admin(auth.uid()));
CREATE POLICY "payout admin update" ON public.offline_bounty_payouts
  FOR UPDATE TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));

-- bounty rates
CREATE POLICY "rates read all auth" ON public.offline_bounty_rates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rates admin write" ON public.offline_bounty_rates
  FOR ALL TO authenticated USING (public.offline_is_admin(auth.uid())) WITH CHECK (public.offline_is_admin(auth.uid()));
