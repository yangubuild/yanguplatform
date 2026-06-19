DROP POLICY IF EXISTS "authenticated_read_realtime_scoped" ON realtime.messages;

CREATE POLICY "authenticated_read_realtime_scoped"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    -- DM channels: topic must embed caller's uid
    WHEN realtime.topic() LIKE 'dm-%'
      THEN position(auth.uid()::text in realtime.topic()) > 0
    WHEN realtime.topic() LIKE 'typing-dm-%'
      THEN position(auth.uid()::text in realtime.topic()) > 0

    -- Group chat: caller must be a member of the group_id encoded in the topic
    WHEN realtime.topic() LIKE 'group-%' THEN EXISTS (
      SELECT 1
      FROM public.chat_group_members m
      WHERE m.user_id = auth.uid()
        AND m.group_id::text = substring(realtime.topic() from 7)
    )

    -- Agency notifications postgres_changes topic must filter on caller's uid.
    -- Topic shape (Supabase Realtime): contains 'agency_notifications' and the filter
    -- 'recipient_user_id=eq.<uuid>'. Require caller's uid to appear in the topic.
    WHEN realtime.topic() LIKE '%agency_notifications%'
      THEN position(auth.uid()::text in realtime.topic()) > 0

    -- All other topics keep current behavior (global chat, post comments,
    -- unread counters, typing presence, builder/ADA/presence channels).
    ELSE true
  END
);