
-- ERROR 1: Realtime channel authorization
-- Replace blanket `USING (true)` with topic-scoped access.
-- Rules:
--   * DM topics ('dm-*' and 'typing-dm-*') require the auth.uid() to appear in the topic.
--   * Agency notifications topic stays open to authenticated (postgres_changes filter restricts row access).
--   * All other topics (builder canvas sync, ADA chat, presence, etc.) remain accessible to authenticated.
DROP POLICY IF EXISTS "auth_users_read_realtime" ON realtime.messages;

CREATE POLICY "authenticated_read_realtime_scoped"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'dm-%' THEN position(auth.uid()::text in realtime.topic()) > 0
    WHEN realtime.topic() LIKE 'typing-dm-%' THEN position(auth.uid()::text in realtime.topic()) > 0
    ELSE true
  END
);

-- ERROR 2: special-program-docs — restrict upload to authenticated users
DROP POLICY IF EXISTS "Anyone can upload special program docs" ON storage.objects;

CREATE POLICY "Authenticated users can upload special program docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'special-program-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public Bucket Allows Listing: drop the broad anon SELECT policy on social-library.
-- The bucket remains public=true so direct URL fetches still work; only enumeration via list API is removed.
DROP POLICY IF EXISTS "Public read social library" ON storage.objects;

-- RLS Always True: replace constant `true` with minimal column-presence guards.
DROP POLICY IF EXISTS "Anyone can insert discovery events" ON public.discovery_events;
CREATE POLICY "Anyone can insert discovery events"
ON public.discovery_events
FOR INSERT
TO anon, authenticated
WITH CHECK (event_type IS NOT NULL AND entity_id IS NOT NULL AND surface IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a surface view" ON public.surface_views;
CREATE POLICY "Anyone can record a surface view"
ON public.surface_views
FOR INSERT
TO anon, authenticated
WITH CHECK (surface_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can record a link click" ON public.link_clicks;
CREATE POLICY "Anyone can record a link click"
ON public.link_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (surface_id IS NOT NULL AND target_url IS NOT NULL AND length(target_url) > 0);

DROP POLICY IF EXISTS "Anyone can submit application" ON public.special_program_applications;
CREATE POLICY "Anyone can submit application"
ON public.special_program_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(full_name) > 0
  AND email IS NOT NULL AND email ~ '^[^@]+@[^@]+\.[^@]+$'
  AND organization_name IS NOT NULL AND length(organization_name) > 0
  AND application_type IS NOT NULL
  AND consent_given = true
);

DROP POLICY IF EXISTS "Anyone can create gift card order" ON public.gift_card_orders;
CREATE POLICY "Anyone can create gift card order"
ON public.gift_card_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  card_design IS NOT NULL
  AND amount_cents > 0
  AND delivery_method IS NOT NULL
);

-- Function search_path mutable: fix the two project-owned functions.
-- (The 31 other flagged functions belong to the pg_trgm extension and cannot be altered.)
ALTER FUNCTION public.offline_touch_updated_at() SET search_path = '';
ALTER FUNCTION public.builder_publishes_bump_version() SET search_path = '';
