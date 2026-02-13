
-- 1. Table for video generation jobs
CREATE TABLE public.ai_video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'creatify',
  prompt text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  result_videos jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.ai_video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own video generations"
ON public.ai_video_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video generations"
ON public.ai_video_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations"
ON public.ai_video_generations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. updated_at trigger
CREATE TRIGGER update_ai_video_generations_updated_at
BEFORE UPDATE ON public.ai_video_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-generated-video', 'ai-generated-video', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage SELECT: users read own files
CREATE POLICY "Users can read own video files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ai-generated-video'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. RPC: create_creatify_generation
CREATE OR REPLACE FUNCTION public.create_creatify_generation(
  p_prompt text,
  p_params jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ai_video_generations (
    user_id, provider, prompt, params, status
  ) VALUES (
    auth.uid(), 'creatify', p_prompt, p_params, 'queued'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7. RPC: get_my_video_generations
CREATE OR REPLACE FUNCTION public.get_my_video_generations(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.ai_video_generations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.ai_video_generations
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 8. RPC: set_video_generation_status (SECURITY DEFINER for edge function)
CREATE OR REPLACE FUNCTION public.set_video_generation_status(
  p_generation_id uuid,
  p_status text,
  p_result_videos jsonb DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.ai_video_generations
  SET status = p_status,
      result_videos = COALESCE(p_result_videos, result_videos),
      error = COALESCE(p_error, error),
      updated_at = now()
  WHERE id = p_generation_id;
END;
$$;
