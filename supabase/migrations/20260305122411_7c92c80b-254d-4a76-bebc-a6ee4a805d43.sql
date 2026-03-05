
-- Provider OAuth tokens table for secure server-side token storage
CREATE TABLE public.provider_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_key)
);

ALTER TABLE public.provider_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens (but not the actual token values from client)
CREATE POLICY "Users can view own token status"
  ON public.provider_oauth_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role / edge functions can insert/update tokens
-- No insert/update/delete policies for authenticated role = edge functions use service_role
