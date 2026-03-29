-- Tighten the publish events INSERT policy to only allow for user's own posts
DROP POLICY IF EXISTS "Users insert own publish events" ON public.social_publish_events;

CREATE POLICY "Users insert own publish events"
ON public.social_publish_events
FOR INSERT
TO authenticated
WITH CHECK (
  post_target_id IS NULL OR EXISTS (
    SELECT 1 FROM social_post_targets pt
    JOIN social_posts sp ON sp.id = pt.post_id
    WHERE pt.id = social_publish_events.post_target_id AND sp.created_by = auth.uid()
  )
);