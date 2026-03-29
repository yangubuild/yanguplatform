
DO $$ BEGIN
  CREATE POLICY "Users manage own post targets" ON public.social_post_targets FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.social_posts sp WHERE sp.id = social_post_targets.post_id AND sp.created_by::uuid = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.social_posts sp WHERE sp.id = social_post_targets.post_id AND sp.created_by::uuid = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own publish events" ON public.social_publish_events FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.social_post_targets pt
      JOIN public.social_posts sp ON sp.id = pt.post_id
      WHERE pt.id = social_publish_events.post_target_id AND sp.created_by::uuid = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
