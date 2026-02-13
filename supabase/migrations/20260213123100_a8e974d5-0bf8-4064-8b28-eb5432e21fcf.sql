
-- 1) ada_media table
CREATE TABLE IF NOT EXISTS public.ada_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.ada_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'image',
  provider TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ada_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media" ON public.ada_media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media" ON public.ada_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access on ada_media" ON public.ada_media
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone select on feature_flags" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins manage feature_flags" ON public.feature_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.feature_flags (key, enabled) VALUES
  ('enable_image_provider_openai', true),
  ('enable_image_provider_qwen', false)
ON CONFLICT (key) DO NOTHING;

-- 3) ada-media private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ada-media', 'ada-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ada-media bucket
CREATE POLICY "Users can view own ada-media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'ada-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own ada-media files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ada-media' AND (storage.foldername(name))[1] = auth.uid()::text);
