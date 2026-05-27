CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push tokens"
ON public.push_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own push tokens"
ON public.push_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own push tokens"
ON public.push_tokens FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own push tokens"
ON public.push_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);

CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();