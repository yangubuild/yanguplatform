
ALTER TABLE public.global_chat_messages ADD COLUMN reply_to uuid REFERENCES public.global_chat_messages(id) ON DELETE SET NULL;

CREATE TABLE public.global_chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.global_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.global_chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions"
  ON public.global_chat_reactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can add reactions"
  ON public.global_chat_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.global_chat_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_reactions;
