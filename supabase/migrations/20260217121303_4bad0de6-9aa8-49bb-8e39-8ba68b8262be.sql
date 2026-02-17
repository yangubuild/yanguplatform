
-- ============================================================
-- connected_accounts (tokens stored here; NO client SELECT)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('instagram','facebook','tiktok')),
  provider_user_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- Drop policies idempotently
DROP POLICY IF EXISTS "Users can insert own connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can update own connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can delete own connected accounts" ON public.connected_accounts;

-- NO SELECT policy on base table

CREATE POLICY "Users can insert own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Safe view (no tokens exposed)
-- ============================================================

CREATE OR REPLACE VIEW public.connected_accounts_safe AS
SELECT id, user_id, provider, provider_user_id, expires_at, created_at, updated_at
FROM public.connected_accounts;

GRANT SELECT ON public.connected_accounts_safe TO authenticated;

-- ============================================================
-- updated_at trigger (idempotent)
-- ============================================================

DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON public.connected_accounts;

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
