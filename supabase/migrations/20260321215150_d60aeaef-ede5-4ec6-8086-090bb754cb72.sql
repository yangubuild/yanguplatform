ALTER TABLE public.chat_groups ADD COLUMN IF NOT EXISTS description text;

CREATE POLICY "Admins can update groups" ON public.chat_groups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = chat_groups.id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Remove group members" ON public.chat_group_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.chat_group_members AS adm
      WHERE adm.group_id = chat_group_members.group_id
      AND adm.user_id = auth.uid()
      AND adm.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can delete own group messages" ON public.chat_group_messages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());