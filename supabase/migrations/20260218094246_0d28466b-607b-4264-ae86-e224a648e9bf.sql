
CREATE TABLE public.publish_attempt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  surface_id uuid NOT NULL,
  domain_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.publish_attempt_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all publish attempt logs"
  ON public.publish_attempt_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own publish attempt logs"
  ON public.publish_attempt_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_publish_attempt_logs_kyc
  ON public.publish_attempt_logs (user_id, created_at DESC)
  WHERE reason = 'KYC_REQUIRED';
