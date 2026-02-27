
-- ===================== TABLES =====================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_id uuid NOT NULL REFERENCES public.builder_surfaces(id),
  tracking_code text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  notes text,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  variant text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index on tracking_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);

-- ===================== RLS =====================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ORDERS: anyone can INSERT (anonymous checkout)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- ORDERS: SELECT — surface owner or admin only (buyer uses track_order RPC)
DROP POLICY IF EXISTS "Surface owners can read orders" ON public.orders;
CREATE POLICY "Surface owners can read orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = orders.surface_id AND bs.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ORDERS: UPDATE — surface owner or admin only
DROP POLICY IF EXISTS "Surface owners can update orders" ON public.orders;
CREATE POLICY "Surface owners can update orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.builder_surfaces bs
    WHERE bs.id = orders.surface_id AND bs.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ORDER ITEMS: INSERT only when parent order exists + pending
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.status = 'pending'
  )
);

-- ORDER ITEMS: SELECT — surface owner, or admin
DROP POLICY IF EXISTS "Owner/buyer can read order items" ON public.order_items;
CREATE POLICY "Owner/admin can read order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.builder_surfaces bs ON bs.id = o.surface_id
    WHERE o.id = order_items.order_id
      AND (bs.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- ===================== TRACKING RPC =====================
CREATE OR REPLACE FUNCTION public.track_order(p_tracking_code text, p_buyer_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o record;
  items jsonb;
BEGIN
  SELECT * INTO o
  FROM public.orders
  WHERE tracking_code = p_tracking_code
    AND lower(buyer_email) = lower(p_buyer_email);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  SELECT coalesce(
    jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at),
    '[]'::jsonb
  ) INTO items
  FROM public.order_items oi
  WHERE oi.order_id = o.id;

  RETURN jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'total_cents', o.total_cents,
    'currency', o.currency,
    'created_at', o.created_at,
    'items', items
  );
END;
$$;

-- ===================== UPDATED_AT TRIGGER =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
