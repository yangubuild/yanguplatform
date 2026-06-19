
DROP POLICY IF EXISTS "auth_users_write_realtime" ON realtime.messages;

CREATE POLICY "auth_users_write_realtime"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE
      WHEN realtime.topic() LIKE 'dm-%'
        THEN POSITION((auth.uid())::text IN realtime.topic()) > 0
      WHEN realtime.topic() LIKE 'typing-dm-%'
        THEN POSITION((auth.uid())::text IN realtime.topic()) > 0
      WHEN realtime.topic() LIKE 'group-%'
        THEN EXISTS (
          SELECT 1 FROM public.chat_group_members m
          WHERE m.user_id = auth.uid()
            AND (m.group_id)::text = SUBSTRING(realtime.topic() FROM 7)
        )
      WHEN realtime.topic() LIKE '%agency_notifications%'
        THEN POSITION((auth.uid())::text IN realtime.topic()) > 0
      ELSE true
    END
  );
