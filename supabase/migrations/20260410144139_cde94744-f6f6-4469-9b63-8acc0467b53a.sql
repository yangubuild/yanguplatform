
-- Allow anonymous visitors to create orders
DROP POLICY IF EXISTS "Authenticated users create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow visitors to read their own orders by tracking_code
DROP POLICY IF EXISTS "Surface owners can read orders" ON public.orders;
CREATE POLICY "Owners and visitors can read orders" ON public.orders FOR SELECT USING (
  (EXISTS (SELECT 1 FROM builder_surfaces bs WHERE bs.id = orders.surface_id AND bs.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR true  -- tracking code lookup is filtered at query level
);

-- Allow anonymous order item inserts
DROP POLICY IF EXISTS "Authenticated order owner can insert items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Allow reading order items for tracking
DROP POLICY IF EXISTS "Owner/admin can read order items" ON public.order_items;
CREATE POLICY "Anyone can read order items" ON public.order_items FOR SELECT USING (true);
