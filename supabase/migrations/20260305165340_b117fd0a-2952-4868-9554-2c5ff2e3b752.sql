
-- visionaire_items
CREATE TABLE public.visionaire_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  thumbnail_url text,
  download_url text,
  external_url text,
  content jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visionaire_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active visionaire items"
ON public.visionaire_items FOR SELECT
USING (is_active = true);

-- visionaire_user_saves
CREATE TABLE public.visionaire_user_saves (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.visionaire_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE public.visionaire_user_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saves"
ON public.visionaire_user_saves FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saves"
ON public.visionaire_user_saves FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saves"
ON public.visionaire_user_saves FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- visionaire_tool_runs
CREATE TABLE public.visionaire_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_key text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}',
  output text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visionaire_tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tool runs"
ON public.visionaire_tool_runs FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tool runs"
ON public.visionaire_tool_runs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('visionaire-uploads', 'visionaire-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('visionaire-assets', 'visionaire-assets', true);

-- Storage RLS for visionaire-uploads (private, user-scoped)
CREATE POLICY "Users can upload to visionaire-uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'visionaire-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own visionaire-uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'visionaire-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS for visionaire-assets (public read)
CREATE POLICY "Public read visionaire-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'visionaire-assets');
