
-- Add idempotency_key to social_publish_events for duplicate webhook protection
ALTER TABLE public.social_publish_events ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_publish_events_idempotency ON public.social_publish_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
