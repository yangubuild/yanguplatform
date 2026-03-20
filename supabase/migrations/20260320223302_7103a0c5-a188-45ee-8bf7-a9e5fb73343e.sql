
-- Posts table
CREATE TABLE public.user_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post reactions (like/love)
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Indexes
CREATE INDEX idx_user_posts_user_id ON public.user_posts(user_id);
CREATE INDEX idx_user_posts_created_at ON public.user_posts(created_at DESC);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);

-- RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- user_posts policies
CREATE POLICY "Anyone authenticated can read posts" ON public.user_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own posts" ON public.user_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.user_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.user_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments policies
CREATE POLICY "Anyone authenticated can read comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_reactions policies
CREATE POLICY "Anyone authenticated can read reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reactions" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
