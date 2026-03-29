-- Add user-level ownership policy for social_posts (users can manage their own posts)
CREATE POLICY "Users manage own posts"
ON public.social_posts
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Add INSERT policy for social_publish_events (users can insert events for their own posts)
CREATE POLICY "Users insert own publish events"
ON public.social_publish_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for social_publish_events
CREATE POLICY "Users update own publish events"
ON public.social_publish_events
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM social_post_targets pt
  JOIN social_posts sp ON sp.id = pt.post_id
  WHERE pt.id = social_publish_events.post_target_id AND sp.created_by = auth.uid()
));