
-- Create avatar_training_jobs table
CREATE TABLE public.avatar_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  payload JSONB,
  avatar_id TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avatar_training_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view own jobs
CREATE POLICY "Users can view own training jobs"
  ON public.avatar_training_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create own jobs
CREATE POLICY "Users can insert own training jobs"
  ON public.avatar_training_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update training jobs (only admins/service can)
CREATE POLICY "Users cannot update training jobs"
  ON public.avatar_training_jobs FOR UPDATE
  USING (false);

-- Admins can manage all
CREATE POLICY "Admins can manage all training jobs"
  ON public.avatar_training_jobs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp trigger
CREATE TRIGGER update_avatar_training_jobs_updated_at
  BEFORE UPDATE ON public.avatar_training_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
