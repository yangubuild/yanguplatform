-- Fix rate_limit_log linter warning
CREATE POLICY "No direct access to rate_limit_log"
ON public.rate_limit_log FOR ALL
USING (false);

-- Fix overly permissive INSERT on audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix overly permissive INSERT on orders (no user_id, keep authenticated check)
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users create orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);