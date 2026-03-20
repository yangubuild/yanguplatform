
-- Verification requests table
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tick_type TEXT NOT NULL CHECK (tick_type IN ('blue', 'orange', 'green')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tick_type)
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification requests"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add verified_tick to profiles (null = not verified, 'blue'/'orange'/'green' = verified type)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_tick TEXT DEFAULT NULL;
