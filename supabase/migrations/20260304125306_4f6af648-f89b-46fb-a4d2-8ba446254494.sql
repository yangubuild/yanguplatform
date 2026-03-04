-- Phase 4: Dropship Order Creation & Tracking
-- Tables already created from partial migration above, so only create if not exists

CREATE TABLE IF NOT EXISTS public.dropship_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_surface_id uuid NOT NULL,
  provider_key text NOT NULL,
  provider_order_id text,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  provider_payload jsonb,
  last_error text,
  total_cost_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropship_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id uuid NOT NULL REFERENCES public.dropship_orders(id) ON DELETE CASCADE,
  external_product_id text NOT NULL,
  external_variant_id text NOT NULL,
  product_title text NOT NULL DEFAULT '',
  variant_name text,
  sku text,
  quantity int NOT NULL DEFAULT 1,
  unit_price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dropship_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id uuid NOT NULL REFERENCES public.dropship_orders(id) ON DELETE CASCADE,
  provider_shipment_id text,
  tracking_number text,
  carrier text,
  status text NOT NULL DEFAULT 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropship_orders_shop_surface ON public.dropship_orders(shop_surface_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_provider ON public.dropship_orders(provider_key);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_status ON public.dropship_orders(status);
CREATE INDEX IF NOT EXISTS idx_dropship_shipments_order ON public.dropship_shipments(dropship_order_id);

ALTER TABLE public.dropship_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropship_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropship_shipments ENABLE ROW LEVEL SECURITY;

-- RLS using org_memberships (correct table name)
CREATE POLICY "org_members_read_dropship_orders"
  ON public.dropship_orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.surfaces s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = dropship_orders.shop_surface_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_read_dropship_order_items"
  ON public.dropship_order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dropship_orders o
      JOIN public.surfaces s ON s.id = o.shop_surface_id
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE o.id = dropship_order_items.dropship_order_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_read_dropship_shipments"
  ON public.dropship_shipments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dropship_orders o
      JOIN public.surfaces s ON s.id = o.shop_surface_id
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE o.id = dropship_shipments.dropship_order_id
        AND om.user_id = auth.uid()
    )
  );

-- RPCs

CREATE OR REPLACE FUNCTION public.create_dropship_order_intent(
  p_shop_surface_id uuid,
  p_provider_key text,
  p_items jsonb,
  p_shipping_address jsonb,
  p_customer jsonb,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_total int := 0;
  v_currency text := 'USD';
BEGIN
  INSERT INTO dropship_orders (shop_surface_id, provider_key, shipping_address, customer, notes, status)
  VALUES (p_shop_surface_id, p_provider_key, p_shipping_address, p_customer, p_notes, 'pending')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO dropship_order_items (
      dropship_order_id, external_product_id, external_variant_id,
      product_title, variant_name, sku, quantity, unit_price_cents, currency
    ) VALUES (
      v_order_id,
      v_item->>'external_product_id',
      v_item->>'external_variant_id',
      COALESCE(v_item->>'product_title', ''),
      v_item->>'variant_name',
      v_item->>'sku',
      COALESCE((v_item->>'quantity')::int, 1),
      COALESCE((v_item->>'unit_price_cents')::int, 0),
      COALESCE(v_item->>'currency', 'USD')
    );
    v_total := v_total + (COALESCE((v_item->>'quantity')::int, 1) * COALESCE((v_item->>'unit_price_cents')::int, 0));
    v_currency := COALESCE(v_item->>'currency', 'USD');
  END LOOP;

  UPDATE dropship_orders SET total_cost_cents = v_total, currency = v_currency WHERE id = v_order_id;
  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_dropship_order_result(
  p_dropship_order_id uuid,
  p_status text,
  p_provider_order_id text DEFAULT NULL,
  p_provider_payload jsonb DEFAULT NULL,
  p_last_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE dropship_orders
  SET
    status = p_status,
    provider_order_id = COALESCE(p_provider_order_id, provider_order_id),
    provider_payload = COALESCE(p_provider_payload, provider_payload),
    last_error = p_last_error,
    updated_at = now()
  WHERE id = p_dropship_order_id;
END;
$$;