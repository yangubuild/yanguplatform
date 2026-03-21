
-- Chat lists for business organization
CREATE TABLE public.chat_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lists"
  ON public.chat_lists FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chat list members (can be users or groups)
CREATE TABLE public.chat_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.chat_lists(id) ON DELETE CASCADE,
  member_user_id UUID,
  member_group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, member_user_id),
  UNIQUE (list_id, member_group_id)
);

ALTER TABLE public.chat_list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage members of own lists"
  ON public.chat_list_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.chat_lists WHERE id = list_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_lists WHERE id = list_id AND user_id = auth.uid())
  );
