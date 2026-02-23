
-- =============================================
-- MANAGEMENT HUB HARDENING v1
-- =============================================

-- 1) Add missing indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email_status ON public.admin_invites (lower(email), status);

-- 2) Harden manage_set_user_roles: prevent removing LAST admin
CREATE OR REPLACE FUNCTION public.manage_set_user_roles(p_user_id uuid, p_roles app_role[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_roles app_role[];
  v_other_admin_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Snapshot current roles
  SELECT array_agg(role) INTO v_old_roles FROM public.user_roles WHERE user_id = p_user_id;

  -- If target currently has admin and new set does NOT include admin…
  IF 'admin' = ANY(COALESCE(v_old_roles, '{}')) AND NOT ('admin' = ANY(p_roles)) THEN
    -- Block self-demotion
    IF p_user_id = auth.uid() THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot remove your own admin role');
    END IF;
    -- Block removing the LAST admin
    SELECT count(*)::int INTO v_other_admin_count
    FROM public.user_roles
    WHERE role = 'admin' AND user_id <> p_user_id;
    IF v_other_admin_count = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last admin');
    END IF;
  END IF;

  -- Replace roles
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  INSERT INTO public.user_roles (user_id, role)
  SELECT p_user_id, unnest(p_roles)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Audit with old + new
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (auth.uid(), 'set_roles', 'user', p_user_id,
          to_jsonb(v_old_roles), to_jsonb(p_roles));

  RETURN jsonb_build_object('success', true, 'roles', to_jsonb(p_roles));
END;
$function$;

-- 3) Harden manage_invite_user: per email+role duplicate check
CREATE OR REPLACE FUNCTION public.manage_invite_user(p_email text, p_roles app_role[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
  v_invite_id uuid;
  v_skipped text[] := '{}';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOREACH v_role IN ARRAY p_roles
  LOOP
    -- Skip if pending invite already exists for this email+role
    IF EXISTS (
      SELECT 1 FROM public.admin_invites
      WHERE lower(email) = lower(p_email) AND role = v_role AND status = 'pending'
    ) THEN
      v_skipped := array_append(v_skipped, v_role::text);
      CONTINUE;
    END IF;

    INSERT INTO public.admin_invites (email, role, invited_by, status)
    VALUES (lower(p_email), v_role, auth.uid(), 'pending')
    RETURNING id INTO v_invite_id;
  END LOOP;

  -- Audit
  INSERT INTO public.audit_logs (user_id, action, entity_type, new_data)
  VALUES (auth.uid(), 'invite_user', 'admin_invite',
          jsonb_build_object('email', p_email, 'roles', to_jsonb(p_roles), 'skipped', to_jsonb(v_skipped)));

  RETURN jsonb_build_object('success', true, 'email', p_email, 'roles', to_jsonb(p_roles), 'skipped_duplicates', to_jsonb(v_skipped));
END;
$function$;
