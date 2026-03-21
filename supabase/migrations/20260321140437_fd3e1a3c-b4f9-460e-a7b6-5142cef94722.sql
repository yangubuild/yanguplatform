-- Add invited_user_id column to admin_invites
ALTER TABLE public.admin_invites ADD COLUMN IF NOT EXISTS invited_user_id uuid;

-- Fix existing pending invite: set invited_user_id for kafeeroa
UPDATE public.admin_invites 
SET invited_user_id = '81730258-d910-4e0b-84bf-d4c6e31e11c6'
WHERE id = 'c064a068-99a8-4d66-aee2-57ee05acbddf';

-- Recreate the accept_team_invite function to match by user_id OR email
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_email text;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  
  -- Get the invite
  SELECT * INTO v_invite FROM public.admin_invites WHERE id = p_invite_id;
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  -- Check invite is still pending
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite already %', v_invite.status;
  END IF;

  -- Verify the current user matches: by invited_user_id first, then by email fallback
  IF v_invite.invited_user_id IS NOT NULL THEN
    IF v_uid <> v_invite.invited_user_id THEN
      RAISE EXCEPTION 'This invite is not for your account';
    END IF;
  ELSE
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    IF lower(v_email) <> lower(v_invite.email) THEN
      RAISE EXCEPTION 'This invite is not for your account';
    END IF;
  END IF;

  -- Create org membership if invited_by has an org
  INSERT INTO public.org_memberships (user_id, org_id, role)
  SELECT v_uid, om.org_id, v_invite.role::text
  FROM public.org_memberships om
  WHERE om.user_id = v_invite.invited_by
    AND om.role = 'owner'
  LIMIT 1
  ON CONFLICT (user_id, org_id) DO NOTHING;

  -- Add user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, v_invite.role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark invite accepted
  UPDATE public.admin_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_invite_id;
END;
$$;

NOTIFY pgrst, 'reload schema';