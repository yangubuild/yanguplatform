-- Create a security definer function to check group membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Create a function to check admin/owner role
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role IN ('admin', 'owner')
  )
$$;

-- Drop all existing broken policies
DROP POLICY IF EXISTS "Members can read group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Creator can add members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Remove group members" ON public.chat_group_members;

DROP POLICY IF EXISTS "Members can read their groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

DROP POLICY IF EXISTS "Members can read group messages" ON public.chat_group_messages;
DROP POLICY IF EXISTS "Members can send group messages" ON public.chat_group_messages;
DROP POLICY IF EXISTS "Users can delete own group messages" ON public.chat_group_messages;

-- Recreate policies using security definer functions

-- chat_group_members
CREATE POLICY "Members can read group members"
ON public.chat_group_members FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Creator can add members"
ON public.chat_group_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_group_admin(auth.uid(), group_id)
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.chat_groups WHERE id = group_id AND created_by = auth.uid())
);

CREATE POLICY "Remove group members"
ON public.chat_group_members FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_admin(auth.uid(), group_id)
);

-- chat_groups
CREATE POLICY "Members can read their groups"
ON public.chat_groups FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Users can create groups"
ON public.chat_groups FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update groups"
ON public.chat_groups FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), id));

-- chat_group_messages
CREATE POLICY "Members can read group messages"
ON public.chat_group_messages FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send group messages"
ON public.chat_group_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can delete own group messages"
ON public.chat_group_messages FOR DELETE TO authenticated
USING (user_id = auth.uid());