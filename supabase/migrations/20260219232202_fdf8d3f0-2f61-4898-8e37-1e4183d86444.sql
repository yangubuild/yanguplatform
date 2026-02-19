-- Secure drive_tokens table: NO client-accessible policies
CREATE TABLE IF NOT EXISTS public.drive_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drive_tokens ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: no RLS policies on this table.

-- Safe boolean-only RPC for UI "connected?" check
CREATE OR REPLACE FUNCTION public.is_drive_connected()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.drive_tokens
    WHERE user_id = auth.uid()
      AND refresh_token IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_drive_connected() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_drive_connected() TO authenticated;