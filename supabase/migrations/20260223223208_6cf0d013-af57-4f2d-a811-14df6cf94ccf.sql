
-- ============================================================
-- MANAGEMENT HUB RPCs — called from manage.yangu.studio
-- All SECURITY DEFINER, admin-gated via has_role()
-- ============================================================

-- 1) manage_overview_stats: dashboard summary counts
CREATE OR REPLACE FUNCTION public.manage_overview_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_users int;
  v_total_surfaces int;
  v_active_publishes int;
  v_total_orgs int;
  v_pending_invites int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT count(*)::int INTO v_total_users FROM public.profiles;
  SELECT count(*)::int INTO v_total_surfaces FROM public.surfaces WHERE archived_at IS NULL;
  SELECT count(*)::int INTO v_active_publishes FROM public.surface_publishes WHERE state = 'published' AND unpublished_at IS NULL;
  SELECT count(*)::int INTO v_total_orgs FROM public.orgs;
  SELECT count(*)::int INTO v_pending_invites FROM public.admin_invites WHERE status = 'pending';

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'total_surfaces', v_total_surfaces,
    'active_publishes', v_active_publishes,
    'total_orgs', v_total_orgs,
    'pending_invites', v_pending_invites
  );
END;
$$;

-- 2) manage_list_users: return all profiles with their roles
CREATE OR REPLACE FUNCTION public.manage_list_users(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_agg(row_data ORDER BY created_at DESC)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'country', p.country,
      'creator_type', p.creator_type,
      'business_name', p.business_name,
      'onboarding_completed', p.onboarding_completed,
      'created_at', p.created_at,
      'roles', COALESCE(
        (SELECT jsonb_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.id),
        '[]'::jsonb
      )
    ) AS row_data,
    p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3) manage_set_user_roles: replace a user's roles with the given array
CREATE OR REPLACE FUNCTION public.manage_set_user_roles(
  p_user_id uuid,
  p_roles app_role[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Prevent removing your own admin role
  IF p_user_id = auth.uid() AND 'admin' = ANY(
    (SELECT array_agg(role) FROM public.user_roles WHERE user_id = p_user_id)::app_role[]
  ) AND NOT ('admin' = ANY(p_roles)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove your own admin role');
  END IF;

  -- Delete existing roles
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  -- Insert new roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT p_user_id, unnest(p_roles)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'set_roles', 'user', p_user_id, to_jsonb(p_roles));

  RETURN jsonb_build_object('success', true, 'roles', to_jsonb(p_roles));
END;
$$;

-- 4) manage_invite_user: invite by email with multiple roles
CREATE OR REPLACE FUNCTION public.manage_invite_user(
  p_email text,
  p_roles app_role[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role app_role;
  v_invite_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Check if already invited and pending
  IF EXISTS (
    SELECT 1 FROM public.admin_invites
    WHERE lower(email) = lower(p_email) AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a pending invite');
  END IF;

  -- Create one invite per role
  FOREACH v_role IN ARRAY p_roles
  LOOP
    INSERT INTO public.admin_invites (email, role, invited_by, status)
    VALUES (lower(p_email), v_role, auth.uid(), 'pending')
    RETURNING id INTO v_invite_id;
  END LOOP;

  -- Log
  INSERT INTO public.audit_logs (user_id, action, entity_type, new_data)
  VALUES (auth.uid(), 'invite_user', 'admin_invite', jsonb_build_object('email', p_email, 'roles', to_jsonb(p_roles)));

  RETURN jsonb_build_object('success', true, 'email', p_email, 'roles', to_jsonb(p_roles));
END;
$$;

-- 5) manage_list_invites: list all invites for the team page
CREATE OR REPLACE FUNCTION public.manage_list_invites()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ai.id,
      'email', ai.email,
      'role', ai.role,
      'status', ai.status,
      'created_at', ai.created_at,
      'accepted_at', ai.accepted_at
    ) ORDER BY ai.created_at DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM public.admin_invites ai;

  RETURN v_result;
END;
$$;

-- 6) manage_recent_audit_logs: last N audit entries
CREATE OR REPLACE FUNCTION public.manage_recent_audit_logs(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', al.id,
      'user_id', al.user_id,
      'action', al.action,
      'entity_type', al.entity_type,
      'entity_id', al.entity_id,
      'new_data', al.new_data,
      'created_at', al.created_at
    ) ORDER BY al.created_at DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT * FROM public.audit_logs
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) al;

  RETURN v_result;
END;
$$;
