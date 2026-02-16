
-- Fix 1: Update RLS policy to allow Admins too
DROP POLICY IF EXISTS "Owners can manage all invites" ON public.admin_invites;

CREATE POLICY "Owners or Admins can manage invites"
ON public.admin_invites
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Fix 2: Replace send_admin_invite with proper conflict target and admin access
CREATE OR REPLACE FUNCTION public.send_admin_invite(p_email text, p_role public.app_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _clean_email text := lower(trim(p_email));
  v_id uuid;
BEGIN
  IF NOT (
    public.has_role(_caller_id, 'owner'::public.app_role) OR
    public.has_role(_caller_id, 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Owner or Admin access required';
  END IF;

  INSERT INTO public.admin_invites (email, role, invited_by, status)
  VALUES (_clean_email, p_role, _caller_id, 'pending')
  ON CONFLICT (lower(email), role) WHERE status = 'pending'
  DO UPDATE SET invited_by = _caller_id, created_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Also fix revoke to allow admins
CREATE OR REPLACE FUNCTION public.revoke_admin_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'owner'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Owner or Admin access required';
  END IF;

  UPDATE public.admin_invites
  SET status = 'revoked'
  WHERE id = p_invite_id AND status = 'pending';
END;
$$;
