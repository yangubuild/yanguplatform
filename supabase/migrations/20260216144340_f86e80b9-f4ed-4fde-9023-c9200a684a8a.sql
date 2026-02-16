
-- 1. Create avatars bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies (idempotent with DROP IF EXISTS)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Admin reset function (uses confirmed schema: public.profiles, public.orgs, public.org_memberships)
CREATE OR REPLACE FUNCTION public.admin_reset_user_onboarding(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Admin or service_role only
  IF auth.role() != 'service_role' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email: %', p_email;
  END IF;

  -- Reset profile fields
  UPDATE public.profiles
  SET onboarding_completed = false,
      username = NULL,
      display_name = NULL,
      avatar_url = NULL,
      creator_type = NULL,
      updated_at = now()
  WHERE id = v_user_id;

  -- Remove org memberships
  DELETE FROM public.org_memberships
  WHERE user_id = v_user_id;

  -- Remove orgs owned by user (cascades billing via trigger)
  DELETE FROM public.orgs
  WHERE owner_user_id = v_user_id;
END;
$$;
