
-- ============================================================
-- YANGU SECURITY HARDENING PASS
-- ============================================================

-- 1. FIX CRITICAL: profiles public SELECT exposes internal fields
-- Create a restricted view for public profile data and replace the broad policy
DROP POLICY IF EXISTS "Users can view published surface owners" ON public.profiles;

CREATE POLICY "Public can view limited published surface owner data"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public_surfaces
    WHERE public_surfaces.user_id = profiles.id
      AND public_surfaces.is_published = true
  )
  AND (
    -- Only allow reading these columns conceptually;
    -- in practice we restrict via a security definer function
    true
  )
);

-- Actually, column-level RLS doesn't exist in Postgres. 
-- Best approach: create a view that only exposes safe columns.
DROP POLICY IF EXISTS "Public can view limited published surface owner data" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profile_view AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.avatar_mode,
  p.avatar_emoji_key,
  p.cover_url,
  p.cover_crop,
  p.social_links,
  p.business_name,
  p.country,
  p.creator_type
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public_surfaces ps
  WHERE ps.user_id = p.id AND ps.is_published = true
);

-- Re-add the old policy but scoped to authenticated users only who own published surfaces
-- (public readers should use the view instead)
CREATE POLICY "Authenticated users can view published surface owners"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public_surfaces
    WHERE public_surfaces.user_id = profiles.id
      AND public_surfaces.is_published = true
  )
);

-- 2. FIX CRITICAL: merchant_promo_redemptions INSERT allows any user_id
DROP POLICY IF EXISTS "Authenticated users can redeem promos" ON public.merchant_promo_redemptions;

CREATE POLICY "Users can only redeem promos as themselves"
ON public.merchant_promo_redemptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. FIX WARN: app_registry exposes draft/non-public apps
DROP POLICY IF EXISTS "Anyone can read active apps" ON public.app_registry;

CREATE POLICY "Anyone can read active public apps"
ON public.app_registry
FOR SELECT
USING (status = 'active' AND visibility = 'public');

-- Keep admin read access
CREATE POLICY "Admins can read all apps"
ON public.app_registry
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. FIX WARN: ads SELECT exposes budget_cents, spent_cents, targeting to public
-- Create a public view for ads that omits sensitive financial data
CREATE OR REPLACE VIEW public.public_ads_view AS
SELECT 
  id, title, content, image_url, target_url, status,
  starts_at, ends_at, created_at
FROM public.ads
WHERE status = 'active';

-- 5. FIX WARN: visionaire_request_votes exposes user_ids publicly
DROP POLICY IF EXISTS "Anyone can view votes" ON public.visionaire_request_votes;

-- Replace with authenticated-only read
CREATE POLICY "Authenticated users can view votes"
ON public.visionaire_request_votes
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to see aggregate counts only (via view)
CREATE OR REPLACE VIEW public.public_vote_counts AS
SELECT request_id, count(*) as vote_count
FROM public.visionaire_request_votes
GROUP BY request_id;

-- 6. FIX WARN: builder_events INSERT with WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert builder events" ON public.builder_events;

CREATE POLICY "Authenticated users can insert builder events"
ON public.builder_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. FIX WARN: orders INSERT with WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. FIX INFO: drive_tokens has RLS enabled but no policies
-- These are sensitive tokens - only the owning user should access
CREATE POLICY "Users can manage own drive tokens"
ON public.drive_tokens
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. FIX INFO: dropship_provider_tokens has RLS enabled but no policies
-- Only service role should access these (via edge functions), block all direct access
CREATE POLICY "No direct access to provider tokens"
ON public.dropship_provider_tokens
FOR SELECT
TO authenticated
USING (false);

-- 10. Harden audit_logs - should be insert-only, read by admins only
-- Check existing policies first and add if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Admins can read audit logs') THEN
    EXECUTE 'CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'System can insert audit logs') THEN
    EXECUTE 'CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

-- 11. Harden admin_invites - admin-only access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_invites' AND policyname = 'Admins can manage invites') THEN
    EXECUTE 'CREATE POLICY "Admins can manage invites" ON public.admin_invites FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- 12. Harden connected_accounts - user can only access own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_accounts' AND policyname = 'Users manage own connected accounts') THEN
    EXECUTE 'CREATE POLICY "Users manage own connected accounts" ON public.connected_accounts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

-- 13. Harden billing tables - user can only see own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_customers' AND policyname = 'Users can view own billing') THEN
    EXECUTE 'CREATE POLICY "Users can view own billing" ON public.billing_customers FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_subscriptions' AND policyname = 'Users can view own subscriptions') THEN
    EXECUTE 'CREATE POLICY "Users can view own subscriptions" ON public.billing_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_transactions' AND policyname = 'Users can view own credits') THEN
    EXECUTE 'CREATE POLICY "Users can view own credits" ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- 14. Harden developer_app_keys - sensitive, only app owner
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developer_app_keys' AND policyname = 'App owners can manage keys') THEN
    EXECUTE 'CREATE POLICY "App owners can manage keys" ON public.developer_app_keys FOR ALL TO authenticated USING (app_id IN (SELECT id FROM developer_apps WHERE owner_user_id = auth.uid())) WITH CHECK (app_id IN (SELECT id FROM developer_apps WHERE owner_user_id = auth.uid()))';
  END IF;
END $$;

-- 15. Harden creator_payment_profiles - user can only see own
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_payment_profiles' AND policyname = 'Users manage own payment profile') THEN
    EXECUTE 'CREATE POLICY "Users manage own payment profile" ON public.creator_payment_profiles FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid())';
  END IF;
END $$;

-- 16. Ensure user_usage_quotas policy is tightened
-- Currently has ALL with (true) - should be service-role only + user read own
DROP POLICY IF EXISTS "Service role manages usage" ON public.user_usage_quotas;

CREATE POLICY "Users can view own usage"
ON public.user_usage_quotas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role will still bypass RLS for writes (as intended)

-- 17. Harden admin_overrides - admin only
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_overrides' AND policyname = 'Admins can manage overrides') THEN
    EXECUTE 'CREATE POLICY "Admins can manage overrides" ON public.admin_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;
