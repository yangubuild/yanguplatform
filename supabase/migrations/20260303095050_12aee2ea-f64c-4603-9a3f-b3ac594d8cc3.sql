
-- Admin-only RPC to manually set user entitlements by plan
CREATE OR REPLACE FUNCTION public.admin_set_user_entitlements(
  p_user_id uuid,
  p_plan_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _surfaces int;
  _images int;
  _videos int;
  _avatars int;
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  -- Map plan_id to limits
  CASE p_plan_id
    WHEN 'free' THEN
      _surfaces := 1; _images := 0; _videos := 0; _avatars := 0;
    WHEN 'creator' THEN
      _surfaces := 3; _images := 10; _videos := 5; _avatars := 1;
    WHEN 'pro' THEN
      _surfaces := 15; _images := 100; _videos := 30; _avatars := 5;
    WHEN 'enterprise' THEN
      _surfaces := 9999; _images := 9999; _videos := 9999; _avatars := 9999;
    ELSE
      RAISE EXCEPTION 'Invalid plan_id: %', p_plan_id;
  END CASE;

  INSERT INTO public.user_entitlements (
    user_id, plan_id, published_surfaces_limit,
    ai_images_monthly_limit, ai_videos_monthly_limit, ai_avatars_monthly_limit,
    ai_images_used, ai_videos_used, ai_avatars_used,
    updated_at
  ) VALUES (
    p_user_id, p_plan_id, _surfaces,
    _images, _videos, _avatars,
    0, 0, 0,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    published_surfaces_limit = EXCLUDED.published_surfaces_limit,
    ai_images_monthly_limit = EXCLUDED.ai_images_monthly_limit,
    ai_videos_monthly_limit = EXCLUDED.ai_videos_monthly_limit,
    ai_avatars_monthly_limit = EXCLUDED.ai_avatars_monthly_limit,
    ai_images_used = 0,
    ai_videos_used = 0,
    ai_avatars_used = 0,
    updated_at = now();
END;
$$;
