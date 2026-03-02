
-- Add new columns to user_entitlements (if not exist)
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS ai_images_monthly_limit int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_videos_monthly_limit int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_avatars_monthly_limit int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_images_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_videos_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_avatars_used int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_period_start timestamptz NULL,
  ADD COLUMN IF NOT EXISTS billing_period_end timestamptz NULL;

-- Updated get_my_entitlements() returning new fields
CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _email text;
  _is_bypass boolean := false;
  _row public.user_entitlements%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error','Not authenticated');
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _user_id;

  IF _email IN ('yanguabuild@gmail.com','kafeeroaz@gmail.com') THEN
    _is_bypass := true;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
    _is_bypass := true;
  END IF;

  SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id;

  IF _row IS NULL THEN
    RETURN jsonb_build_object(
      'plan_id','free',
      'published_surfaces_limit',1,
      'ai_images_monthly_limit',0,
      'ai_videos_monthly_limit',0,
      'ai_avatars_monthly_limit',0,
      'ai_images_used',0,
      'ai_videos_used',0,
      'ai_avatars_used',0,
      'billing_period_start',null,
      'billing_period_end',null,
      'is_admin_bypass',_is_bypass
    );
  END IF;

  RETURN jsonb_build_object(
    'plan_id', _row.plan_id,
    'published_surfaces_limit', _row.published_surfaces_limit,
    'ai_images_monthly_limit', _row.ai_images_monthly_limit,
    'ai_videos_monthly_limit', _row.ai_videos_monthly_limit,
    'ai_avatars_monthly_limit', _row.ai_avatars_monthly_limit,
    'ai_images_used', _row.ai_images_used,
    'ai_videos_used', _row.ai_videos_used,
    'ai_avatars_used', _row.ai_avatars_used,
    'billing_period_start', _row.billing_period_start,
    'billing_period_end', _row.billing_period_end,
    'is_admin_bypass', _is_bypass
  );
END;
$$;

-- consume_ai_image_credit with advisory lock + auto-ensure
CREATE OR REPLACE FUNCTION public.consume_ai_image_credit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _row public.user_entitlements%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Not authenticated');
  END IF;

  -- Per-user advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));

  SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;

  IF _row IS NULL THEN
    PERFORM public.ensure_my_entitlements();
    SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;
  END IF;

  -- Check billing period
  IF _row.billing_period_end IS NOT NULL AND now() > _row.billing_period_end THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Billing period expired. Awaiting renewal.');
  END IF;

  -- Check limit
  IF _row.ai_images_used >= _row.ai_images_monthly_limit THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Monthly image limit reached');
  END IF;

  -- Increment
  UPDATE public.user_entitlements
    SET ai_images_used = ai_images_used + 1
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('allowed',true,'remaining', _row.ai_images_monthly_limit - _row.ai_images_used - 1);
END;
$$;

-- consume_ai_video_credit with advisory lock + auto-ensure
CREATE OR REPLACE FUNCTION public.consume_ai_video_credit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _row public.user_entitlements%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Not authenticated');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));

  SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;

  IF _row IS NULL THEN
    PERFORM public.ensure_my_entitlements();
    SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;
  END IF;

  IF _row.billing_period_end IS NOT NULL AND now() > _row.billing_period_end THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Billing period expired. Awaiting renewal.');
  END IF;

  IF _row.ai_videos_used >= _row.ai_videos_monthly_limit THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Monthly video limit reached');
  END IF;

  UPDATE public.user_entitlements
    SET ai_videos_used = ai_videos_used + 1
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('allowed',true,'remaining', _row.ai_videos_monthly_limit - _row.ai_videos_used - 1);
END;
$$;

-- consume_ai_avatar_credit with advisory lock + auto-ensure
CREATE OR REPLACE FUNCTION public.consume_ai_avatar_credit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _row public.user_entitlements%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Not authenticated');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));

  SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;

  IF _row IS NULL THEN
    PERFORM public.ensure_my_entitlements();
    SELECT * INTO _row FROM public.user_entitlements WHERE user_id = _user_id FOR UPDATE;
  END IF;

  IF _row.billing_period_end IS NOT NULL AND now() > _row.billing_period_end THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Billing period expired. Awaiting renewal.');
  END IF;

  IF _row.ai_avatars_used >= _row.ai_avatars_monthly_limit THEN
    RETURN jsonb_build_object('allowed',false,'remaining',0,'reason','Monthly avatar limit reached');
  END IF;

  UPDATE public.user_entitlements
    SET ai_avatars_used = ai_avatars_used + 1
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('allowed',true,'remaining', _row.ai_avatars_monthly_limit - _row.ai_avatars_used - 1);
END;
$$;
