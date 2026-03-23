
-- Message reactions for DMs
CREATE TABLE public.dm_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their messages" ON public.dm_reactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can add reactions" ON public.dm_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.dm_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Message reactions for group chats
CREATE TABLE public.group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.chat_group_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group reactions" ON public.group_message_reactions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can add group reactions" ON public.group_message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own group reactions" ON public.group_message_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Chat labels for client management
CREATE TABLE public.chat_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id, label)
);

ALTER TABLE public.chat_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat labels" ON public.chat_labels
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
