-- Scope SELECT on dm_reactions to DM participants
DROP POLICY IF EXISTS "Users can view reactions on their messages" ON public.dm_reactions;
CREATE POLICY "Participants can view DM reactions"
ON public.dm_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.direct_messages dm
    WHERE dm.id = dm_reactions.message_id
      AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
  )
);

-- Scope SELECT on group_message_reactions to group members
DROP POLICY IF EXISTS "Users can view group reactions" ON public.group_message_reactions;
CREATE POLICY "Members can view group reactions"
ON public.group_message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_group_messages m
    WHERE m.id = group_message_reactions.message_id
      AND public.is_group_member(auth.uid(), m.group_id)
  )
);