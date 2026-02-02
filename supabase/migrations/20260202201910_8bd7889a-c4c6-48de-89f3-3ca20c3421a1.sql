
-- Fix the overly permissive audit_logs INSERT policy
-- Only authenticated users can insert their own logs, or admins can insert any
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    public.is_owner(user_id) OR 
    public.has_role(auth.uid(), 'admin')
  );
