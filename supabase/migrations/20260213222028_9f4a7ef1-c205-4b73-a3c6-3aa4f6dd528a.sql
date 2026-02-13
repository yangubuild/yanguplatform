
-- ============================================================
-- FULL: create ai_image_generations table + storage + hardening
-- ============================================================

-- ---------- 0) Create the table ----------
CREATE TABLE public.ai_image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'ideogram',
  prompt text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  result_images jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_image_generations_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.ai_image_generations ENABLE ROW LEVEL SECURITY;

-- RLS: users can insert own rows
CREATE POLICY "Users can insert own generations"
  ON public.ai_image_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS: users can select own rows
CREATE POLICY "Users can select own generations"
  ON public.ai_image_generations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: users can update own rows (with reassignment prevention)
CREATE POLICY "Users can update own generations"
  ON public.ai_image_generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_ai_image_generations_updated_at
  BEFORE UPDATE ON public.ai_image_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 1) RPCs ----------

-- Create generation
CREATE OR REPLACE FUNCTION public.create_ideogram_generation(p_prompt text, p_params jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.ai_image_generations (user_id, provider, prompt, params, status)
  VALUES (auth.uid(), 'ideogram', p_prompt, p_params, 'queued')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Get my generations
CREATE OR REPLACE FUNCTION public.get_my_image_generations(p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS SETOF public.ai_image_generations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.ai_image_generations
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Set generation status (service role only via edge function)
CREATE OR REPLACE FUNCTION public.set_generation_status(
  p_generation_id uuid,
  p_status text,
  p_result_images jsonb DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_image_generations
  SET status = p_status,
      result_images = COALESCE(p_result_images, result_images),
      error = COALESCE(p_error, error),
      updated_at = now()
  WHERE id = p_generation_id;
END;
$$;

-- ---------- 2) Storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-generated', 'ai-generated', false)
ON CONFLICT (id) DO NOTHING;

-- Storage SELECT: users read own files (path: ideogram/{user_id}/...)
DROP POLICY IF EXISTS "Users can read own ai-generated files" ON storage.objects;
CREATE POLICY "Users can read own ai-generated files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-generated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage INSERT: service_role only
DROP POLICY IF EXISTS "Service role can upload ai-generated" ON storage.objects;
CREATE POLICY "Service role can upload ai-generated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-generated'
    AND auth.role() = 'service_role'
  );
