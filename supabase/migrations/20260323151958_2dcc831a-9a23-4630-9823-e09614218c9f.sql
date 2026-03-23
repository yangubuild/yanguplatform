
-- Live Trends: user-created promoted trend messages
CREATE TABLE public.live_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  text text NOT NULL CHECK (length(text) <= 30),
  duration_type text NOT NULL DEFAULT 'day',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_amount_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active trends" ON public.live_trends
  FOR SELECT USING (status = 'active' OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own trends" ON public.live_trends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trends" ON public.live_trends
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
