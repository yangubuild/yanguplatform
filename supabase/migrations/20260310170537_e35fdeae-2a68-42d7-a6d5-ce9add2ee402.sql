-- ============================================================
-- STORAGE BUCKET HARDENING
-- ============================================================

-- 1. email-assets: restrict writes to admin only
CREATE POLICY "Admin insert email-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'email-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin update email-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete email-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read email-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- 2. visionaire-assets: restrict writes to service_role
CREATE POLICY "Service role insert visionaire-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visionaire-assets' AND auth.role() = 'service_role');

CREATE POLICY "Service role update visionaire-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visionaire-assets' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'visionaire-assets' AND auth.role() = 'service_role');

-- 3. Add missing DELETE policies (users can delete their own files)
CREATE POLICY "Users can delete own studio assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'studio-assets' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own visionaire-uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'visionaire-uploads' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete own ada-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ada-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete own ada-audio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ada-audio' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 4. Add file size limits and MIME type restrictions to unprotected buckets
UPDATE storage.buckets SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif']
WHERE id = 'profile-media';

UPDATE storage.buckets SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
WHERE id = 'blog-section-images';

UPDATE storage.buckets SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
WHERE id = 'email-assets';

UPDATE storage.buckets SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']
WHERE id = 'studio-assets';

UPDATE storage.buckets SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif']
WHERE id = 'ai-generated';

UPDATE storage.buckets SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime']
WHERE id = 'ai-generated-video';

UPDATE storage.buckets SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg','audio/wav','audio/mp4','audio/webm','audio/ogg']
WHERE id = 'ada-audio';

UPDATE storage.buckets SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain','text/csv']
WHERE id = 'ada-uploads';

UPDATE storage.buckets SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4']
WHERE id = 'ada-media';

UPDATE storage.buckets SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']
WHERE id = 'visionaire-assets';

UPDATE storage.buckets SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/wav']
WHERE id = 'visionaire-uploads';

-- ============================================================
-- ABUSE CONTROL: Rate limiting table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup
ON public.rate_limit_log (user_id, action_key, created_at DESC);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action_key text,
  p_max_count int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_cutoff timestamptz;
BEGIN
  v_cutoff := now() - (p_window_seconds || ' seconds')::interval;
  
  SELECT count(*) INTO v_count
  FROM public.rate_limit_log
  WHERE user_id = p_user_id
    AND action_key = p_action_key
    AND created_at > v_cutoff;
  
  IF v_count >= p_max_count THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.rate_limit_log (user_id, action_key)
  VALUES (p_user_id, p_action_key);
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_log WHERE created_at < now() - interval '24 hours';
$$;