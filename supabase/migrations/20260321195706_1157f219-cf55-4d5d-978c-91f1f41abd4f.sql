
-- Global chat messages table
CREATE TABLE public.global_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read global chat"
  ON public.global_chat_messages FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can send global chat messages"
  ON public.global_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own global chat messages"
  ON public.global_chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;

-- Group chats table
CREATE TABLE public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Group members
CREATE TABLE public.chat_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Group messages
CREATE TABLE public.chat_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_messages;

-- RLS: Members can read groups they belong to
CREATE POLICY "Members can read their groups"
  ON public.chat_groups FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = id AND user_id = auth.uid()));

-- RLS: Authenticated users can create groups
CREATE POLICY "Users can create groups"
  ON public.chat_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS: Group members can read membership
CREATE POLICY "Members can read group members"
  ON public.chat_group_members FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid()));

-- RLS: Group creator can add members
CREATE POLICY "Creator can add members"
  ON public.chat_group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_groups WHERE id = group_id AND created_by = auth.uid())
    OR user_id = auth.uid()
  );

-- RLS: Members can read group messages
CREATE POLICY "Members can read group messages"
  ON public.chat_group_messages FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_group_messages.group_id AND user_id = auth.uid()));

-- RLS: Members can send group messages
CREATE POLICY "Members can send group messages"
  ON public.chat_group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_group_messages.group_id AND user_id = auth.uid())
  );
