
-- Table to cache provider API tokens across edge function invocations
CREATE TABLE IF NOT EXISTS public.dropship_provider_tokens (
  provider_key text PRIMARY KEY,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — only accessed via service role in edge functions
ALTER TABLE public.dropship_provider_tokens ENABLE ROW LEVEL SECURITY;

-- RPC to get/set token atomically
CREATE OR REPLACE FUNCTION public.get_dropship_provider_token(p_provider_key text)
RETURNS TABLE(access_token text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_token, expires_at
  FROM dropship_provider_tokens
  WHERE provider_key = p_provider_key
    AND expires_at > now() + interval '1 minute'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_dropship_provider_token(
  p_provider_key text,
  p_access_token text,
  p_expires_at timestamptz
) RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO dropship_provider_tokens (provider_key, access_token, expires_at, updated_at)
  VALUES (p_provider_key, p_access_token, p_expires_at, now())
  ON CONFLICT (provider_key) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
$$;
