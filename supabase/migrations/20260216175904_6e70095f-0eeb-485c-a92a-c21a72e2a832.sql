
-- 1) Create table
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'designer'::public.app_role,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- 2) Unique index on lower(email) + role for pending invites
CREATE UNIQUE INDEX IF NOT EXISTS admin_invites_unique_pending
ON public.admin_invites (lower(email), role)
WHERE status = 'pending';

-- 3) Ensure user_roles has a unique index for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique
ON public.user_roles (user_id, role);

-- 4) RLS: owners can manage invites
DROP POLICY IF EXISTS "Owners can manage all invites" ON public.admin_invites;
CREATE POLICY "Owners can manage all invites"
ON public.admin_invites FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

-- 5) Admins can view invites
DROP POLICY IF EXISTS "Admins can view invites" ON public.admin_invites;
CREATE POLICY "Admins can view invites"
ON public.admin_invites FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) send_admin_invite RPC
CREATE OR REPLACE FUNCTION public.send_admin_invite(p_email text, p_role public.app_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner'::public.app_role) THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;

  INSERT INTO public.admin_invites (email, role, invited_by, status)
  VALUES (lower(p_email), p_role, auth.uid(), 'pending')
  ON CONFLICT (lower(email), role) WHERE status = 'pending'
  DO UPDATE SET invited_by = auth.uid(), created_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7) revoke_admin_invite RPC
CREATE OR REPLACE FUNCTION public.revoke_admin_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner'::public.app_role) THEN
    RAISE EXCEPTION 'Owner access required';
  END IF;

  UPDATE public.admin_invites
  SET status = 'revoked'
  WHERE id = p_invite_id AND status = 'pending';
END;
$$;

-- 8) accept_pending_invite RPC
CREATE OR REPLACE FUNCTION public.accept_pending_invite()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  r record;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN; END IF;

  FOR r IN
    SELECT id, role FROM public.admin_invites
    WHERE lower(email) = lower(v_email) AND status = 'pending'
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), r.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.admin_invites
    SET status = 'accepted', accepted_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 9) Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
