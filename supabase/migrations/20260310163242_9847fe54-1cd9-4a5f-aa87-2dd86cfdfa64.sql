
-- Add lifecycle tracking columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_onboarding_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_step text;

-- Backfill existing onboarded users to 'active'
UPDATE public.profiles 
SET account_status = 'active',
    onboarding_completed_at = updated_at
WHERE onboarding_completed = true AND account_status = 'registered';

-- Backfill email_verified_at for users who have confirmed emails
UPDATE public.profiles p
SET email_verified_at = u.email_confirmed_at
FROM auth.users u
WHERE p.id = u.id 
  AND u.email_confirmed_at IS NOT NULL 
  AND p.email_verified_at IS NULL;

-- Backfill verified_pending_onboarding for users with verified email but not onboarded
UPDATE public.profiles
SET account_status = 'verified_pending_onboarding'
WHERE email_verified_at IS NOT NULL 
  AND onboarding_completed = false 
  AND account_status = 'registered';

-- Create trigger to sync email_verified_at when auth.users confirms email
-- We use a function on profiles instead since we can't attach triggers to auth schema
-- Instead, we'll check email verification status on login via the app

-- Create management RPC: list users with lifecycle data
CREATE OR REPLACE FUNCTION public.manage_list_users_lifecycle(
  p_status text DEFAULT NULL,
  p_filter text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT 
      p.id,
      u.email,
      p.username,
      p.display_name,
      p.avatar_url,
      p.creator_type,
      p.country,
      p.business_name,
      p.onboarding_completed,
      p.account_status,
      p.email_verified_at,
      p.onboarding_started_at,
      p.onboarding_completed_at,
      p.onboarding_step,
      p.welcome_email_sent_at,
      p.last_onboarding_reminder_sent_at,
      p.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      u.raw_app_meta_data->>'provider' as auth_provider
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE 
      (p_status IS NULL OR p.account_status = p_status)
      AND (
        p_filter IS NULL 
        OR p_filter = 'all'
        OR (p_filter = 'verified_not_onboarded' AND p.account_status = 'verified_pending_onboarding')
        OR (p_filter = 'onboarding_in_progress' AND p.account_status = 'onboarding_in_progress')
        OR (p_filter = 'active' AND p.account_status = 'active')
        OR (p_filter = 'suspended' AND p.account_status = 'suspended')
        OR (p_filter = 'welcome_not_sent' AND p.account_status = 'active' AND p.welcome_email_sent_at IS NULL)
        OR (p_filter = 'reminder_eligible' AND p.account_status IN ('verified_pending_onboarding', 'onboarding_in_progress') 
            AND (p.last_onboarding_reminder_sent_at IS NULL OR p.last_onboarding_reminder_sent_at < now() - interval '3 days'))
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create management RPC: get lifecycle stats
CREATE OR REPLACE FUNCTION public.manage_user_lifecycle_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total', (SELECT count(*) FROM public.profiles),
    'registered', (SELECT count(*) FROM public.profiles WHERE account_status = 'registered'),
    'verified_pending_onboarding', (SELECT count(*) FROM public.profiles WHERE account_status = 'verified_pending_onboarding'),
    'onboarding_in_progress', (SELECT count(*) FROM public.profiles WHERE account_status = 'onboarding_in_progress'),
    'active', (SELECT count(*) FROM public.profiles WHERE account_status = 'active'),
    'suspended', (SELECT count(*) FROM public.profiles WHERE account_status = 'suspended'),
    'welcome_not_sent', (SELECT count(*) FROM public.profiles WHERE account_status = 'active' AND welcome_email_sent_at IS NULL),
    'reminder_eligible', (SELECT count(*) FROM public.profiles WHERE account_status IN ('verified_pending_onboarding', 'onboarding_in_progress') AND (last_onboarding_reminder_sent_at IS NULL OR last_onboarding_reminder_sent_at < now() - interval '3 days'))
  ) INTO result;

  RETURN result;
END;
$$;

-- Create management RPC: update user lifecycle (suspend/unsuspend, mark emails sent)
CREATE OR REPLACE FUNCTION public.manage_update_user_lifecycle(
  p_user_id uuid,
  p_action text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT account_status INTO current_status FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  CASE p_action
    WHEN 'suspend' THEN
      UPDATE public.profiles SET account_status = 'suspended', updated_at = now() WHERE id = p_user_id;
    WHEN 'unsuspend' THEN
      -- Restore to the appropriate status based on lifecycle state
      UPDATE public.profiles SET 
        account_status = CASE
          WHEN onboarding_completed = true THEN 'active'
          WHEN onboarding_started_at IS NOT NULL THEN 'onboarding_in_progress'
          WHEN email_verified_at IS NOT NULL THEN 'verified_pending_onboarding'
          ELSE 'registered'
        END,
        updated_at = now()
      WHERE id = p_user_id;
    WHEN 'mark_welcome_sent' THEN
      UPDATE public.profiles SET welcome_email_sent_at = now(), updated_at = now() WHERE id = p_user_id;
    WHEN 'mark_reminder_sent' THEN
      UPDATE public.profiles SET last_onboarding_reminder_sent_at = now(), updated_at = now() WHERE id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Unknown action: %', p_action;
  END CASE;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'manage_update_user_lifecycle', 'profile', p_user_id::text, 
    json_build_object('action', p_action, 'previous_status', current_status));

  RETURN json_build_object('success', true);
END;
$$;

-- Create management RPC: get single user detail
CREATE OR REPLACE FUNCTION public.manage_get_user_detail(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT row_to_json(t) INTO result
  FROM (
    SELECT 
      p.*,
      u.email,
      u.last_sign_in_at,
      u.email_confirmed_at,
      u.raw_app_meta_data->>'provider' as auth_provider,
      u.created_at as auth_created_at,
      (SELECT json_agg(json_build_object('role', ur.role)) FROM public.user_roles ur WHERE ur.user_id = p.id) as roles
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = p_user_id
  ) t;

  RETURN result;
END;
$$;
