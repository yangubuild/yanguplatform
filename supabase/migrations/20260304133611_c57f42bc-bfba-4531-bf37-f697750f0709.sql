
-- Phase 6: Currency Consistency

-- 1. Add currency to orgs
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- 2. Add currency fields to dropship_imports
ALTER TABLE public.dropship_imports
  ADD COLUMN IF NOT EXISTS provider_currency text,
  ADD COLUMN IF NOT EXISTS provider_price_cents integer,
  ADD COLUMN IF NOT EXISTS display_currency text,
  ADD COLUMN IF NOT EXISTS display_price_cents integer,
  ADD COLUMN IF NOT EXISTS fx_rate numeric(18,8),
  ADD COLUMN IF NOT EXISTS fx_rate_timestamp timestamptz;

-- 3. Create fx_rates table
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric(18,8) NOT NULL,
  as_of timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency)
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fx_rates"
  ON public.fx_rates FOR SELECT TO authenticated USING (true);

-- 4. Upsert FX rate RPC
CREATE OR REPLACE FUNCTION public.upsert_fx_rate(
  p_base_currency text,
  p_quote_currency text,
  p_rate numeric,
  p_as_of timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fx_rates (base_currency, quote_currency, rate, as_of)
  VALUES (p_base_currency, p_quote_currency, p_rate, p_as_of)
  ON CONFLICT (base_currency, quote_currency)
  DO UPDATE SET rate = EXCLUDED.rate, as_of = EXCLUDED.as_of;
END;
$$;

-- 5. Update import RPC to accept currency fields
CREATE OR REPLACE FUNCTION public.import_external_product_to_shop(
  p_provider_key text,
  p_external_product_id text,
  p_shop_surface_id uuid,
  p_title text,
  p_images jsonb,
  p_variants jsonb,
  p_raw jsonb,
  p_provider_currency text DEFAULT NULL,
  p_provider_price_cents integer DEFAULT NULL,
  p_display_currency text DEFAULT NULL,
  p_display_price_cents integer DEFAULT NULL,
  p_fx_rate numeric DEFAULT NULL,
  p_fx_rate_timestamp timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_id uuid;
BEGIN
  INSERT INTO public.dropship_imports (
    shop_surface_id, provider_key, external_product_id, title, images, variants, raw,
    provider_currency, provider_price_cents, display_currency, display_price_cents,
    fx_rate, fx_rate_timestamp
  ) VALUES (
    p_shop_surface_id, p_provider_key, p_external_product_id, p_title, p_images, p_variants, p_raw,
    p_provider_currency, p_provider_price_cents, p_display_currency, p_display_price_cents,
    p_fx_rate, p_fx_rate_timestamp
  )
  RETURNING id INTO v_id;

  SELECT jsonb_build_object(
    'id', di.id,
    'shop_surface_id', di.shop_surface_id,
    'provider_key', di.provider_key,
    'external_product_id', di.external_product_id,
    'title', di.title,
    'images', di.images,
    'variants', di.variants,
    'provider_currency', di.provider_currency,
    'display_currency', di.display_currency,
    'display_price_cents', di.display_price_cents,
    'created_at', di.created_at
  ) INTO v_result
  FROM public.dropship_imports di
  WHERE di.id = v_id;

  RETURN v_result;
END;
$$;
