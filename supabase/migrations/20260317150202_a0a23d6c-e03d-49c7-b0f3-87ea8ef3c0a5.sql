
-- ============================================================
-- C1: Harden order_items INSERT — require auth + order ownership
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Authenticated order owner can insert items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.status = 'pending'
      AND (
        -- The buyer who placed the order (matched by auth email)
        o.buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        -- OR the surface owner
        OR EXISTS (
          SELECT 1 FROM builder_surfaces bs
          WHERE bs.id = o.surface_id AND bs.user_id = auth.uid()
        )
        -- OR admin
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- ============================================================
-- C2: Remove overly broad profiles SELECT policy
-- The "published surface owners" policy leaks internal fields.
-- Public reads should go through public_profile_view instead.
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view published surface owners" ON public.profiles;

-- ============================================================
-- C3: Recreate connected_accounts_safe as SECURITY INVOKER
-- so underlying RLS on connected_accounts is enforced
-- ============================================================
DROP VIEW IF EXISTS public.connected_accounts_safe;

CREATE VIEW public.connected_accounts_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  provider,
  provider_user_id,
  expires_at,
  created_at,
  updated_at
FROM public.connected_accounts;
