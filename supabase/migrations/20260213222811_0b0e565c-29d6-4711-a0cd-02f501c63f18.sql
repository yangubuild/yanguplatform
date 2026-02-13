CREATE OR REPLACE FUNCTION public.create_qwen_generation(
  p_prompt text,
  p_params jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ai_image_generations (
    user_id,
    provider,
    prompt,
    params,
    status
  )
  VALUES (
    auth.uid(),
    'qwen',
    p_prompt,
    p_params,
    'queued'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;