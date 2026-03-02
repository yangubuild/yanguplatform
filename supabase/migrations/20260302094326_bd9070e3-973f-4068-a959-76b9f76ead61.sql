-- Atomic RPC: consume one free image generation
CREATE OR REPLACE FUNCTION public.consume_free_image()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_claimed boolean;
  v_used integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT dashboard_credit_claimed,
         COALESCE(free_images_used, 0)
    INTO v_claimed, v_used
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_claimed IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_CLAIMED');
  END IF;

  IF v_used >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LIMIT_REACHED', 'used', v_used, 'limit', 5);
  END IF;

  UPDATE public.profiles
  SET free_images_used = COALESCE(free_images_used, 0) + 1,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'used', v_used + 1, 'limit', 5);
END;
$$;

-- Atomic RPC: consume one free video generation
CREATE OR REPLACE FUNCTION public.consume_free_video()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_claimed boolean;
  v_used integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT dashboard_credit_claimed,
         COALESCE(free_videos_used, 0)
    INTO v_claimed, v_used
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_claimed IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_CLAIMED');
  END IF;

  IF v_used >= 2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LIMIT_REACHED', 'used', v_used, 'limit', 2);
  END IF;

  UPDATE public.profiles
  SET free_videos_used = COALESCE(free_videos_used, 0) + 1,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true, 'used', v_used + 1, 'limit', 2);
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.consume_free_image() FROM anon;
REVOKE ALL ON FUNCTION public.consume_free_video() FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_free_image() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_free_video() TO authenticated;

NOTIFY pgrst, 'reload schema';