-- Provider credentials for a channel. Never readable by any client role:
-- only edge functions (service role) can read or write these rows.
CREATE TABLE public.agent_channel_secrets (
  channel_id uuid NOT NULL PRIMARY KEY REFERENCES public.agent_channels(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.agent_channel_secrets TO service_role;
ALTER TABLE public.agent_channel_secrets ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies for anon/authenticated: the table is server-only.

CREATE TRIGGER agent_channel_secrets_touch
  BEFORE UPDATE ON public.agent_channel_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();