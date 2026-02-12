-- 0) Ensure helper trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1) ADA chat persistence
CREATE TABLE public.ada_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ada_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.ada_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Knowledge grounding tables
CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'page',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Indexes
CREATE INDEX idx_ada_chats_user ON public.ada_chats(user_id);
CREATE INDEX idx_ada_messages_chat ON public.ada_messages(chat_id);
CREATE INDEX idx_knowledge_chunks_source ON public.knowledge_chunks(source_id);

-- 4) Updated_at triggers
CREATE TRIGGER update_ada_chats_updated_at
  BEFORE UPDATE ON public.ada_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) RLS
ALTER TABLE public.ada_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ada_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 6) Policies: ada_chats
CREATE POLICY "Users can view own chats"
ON public.ada_chats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
ON public.ada_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
ON public.ada_chats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
ON public.ada_chats FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all chats"
ON public.ada_chats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7) Policies: ada_messages
CREATE POLICY "Users can view own chat messages"
ON public.ada_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ada_chats
    WHERE id = ada_messages.chat_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own chat messages"
ON public.ada_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ada_chats
    WHERE id = ada_messages.chat_id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all messages"
ON public.ada_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 8) Policies: knowledge_sources
CREATE POLICY "Anyone can view active sources"
ON public.knowledge_sources FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage sources"
ON public.knowledge_sources FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 9) Policies: knowledge_chunks
CREATE POLICY "Anyone can view chunks"
ON public.knowledge_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_sources
    WHERE id = knowledge_chunks.source_id
      AND is_active = true
  )
);

CREATE POLICY "Admins can manage chunks"
ON public.knowledge_chunks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));