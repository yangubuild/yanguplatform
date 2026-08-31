-- ── Omnichannel foundation: channel registry + web chat sessions ──────────

CREATE TABLE public.agent_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agent_agents(id) ON DELETE CASCADE,
  channel text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'setup_required',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  last_health_check_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_channels_channel_chk CHECK (channel IN ('voice','whatsapp','webchat')),
  CONSTRAINT agent_channels_status_chk CHECK (status IN ('setup_required','connected','error','disabled')),
  CONSTRAINT agent_channels_unique UNIQUE (agent_id, channel)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_channels TO authenticated;
GRANT ALL ON public.agent_channels TO service_role;
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_channels_read ON public.agent_channels
  FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY agent_channels_write ON public.agent_channels
  FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));

CREATE INDEX agent_channels_org_idx ON public.agent_channels (org_id, channel);

CREATE TRIGGER agent_channels_touch
  BEFORE UPDATE ON public.agent_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Web chat visitor sessions. Tokens are stored hashed; only edge functions
-- (service role) ever read them.
CREATE TABLE public.agent_webchat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agent_agents(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.agent_channels(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.agent_contacts(id) ON DELETE SET NULL,
  token_hash text NOT NULL UNIQUE,
  visitor_key text,
  origin text,
  user_agent text,
  message_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_webchat_sessions TO authenticated;
GRANT ALL ON public.agent_webchat_sessions TO service_role;
ALTER TABLE public.agent_webchat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_webchat_sessions_read ON public.agent_webchat_sessions
  FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));

CREATE INDEX agent_webchat_sessions_agent_idx ON public.agent_webchat_sessions (agent_id, created_at DESC);
CREATE INDEX agent_webchat_sessions_visitor_idx ON public.agent_webchat_sessions (org_id, visitor_key);

-- ── Message-level channel + provider delivery metadata ───────────────────
ALTER TABLE public.agent_messages
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS delivery_status_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS agent_messages_provider_msg_uidx
  ON public.agent_messages (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE public.agent_conversations
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.agent_channels(id) ON DELETE SET NULL;

-- ── Anonymous web chat identity resolution ───────────────────────────────
CREATE OR REPLACE FUNCTION public.agent_resolve_webchat_customer(
  p_org_id uuid,
  p_visitor_key text,
  p_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key text := nullif(btrim(coalesce(p_visitor_key, '')), '');
  v_id uuid;
BEGIN
  IF p_org_id IS NULL OR v_key IS NULL THEN RETURN NULL; END IF;

  SELECT contact_id INTO v_id FROM public.agent_customer_identities
  WHERE org_id = p_org_id AND identity_type = 'webchat' AND identity_value = v_key
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.agent_contacts (org_id, name, channel, source, last_interaction_at)
    VALUES (p_org_id, nullif(btrim(coalesce(p_name, '')), ''), 'webchat', 'webchat', now())
    RETURNING id INTO v_id;

    INSERT INTO public.agent_customer_identities (org_id, contact_id, identity_type, identity_value, is_verified, source)
    VALUES (p_org_id, v_id, 'webchat', v_key, false, 'webchat')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.agent_customer_events (org_id, contact_id, event_type, title, ref_type, ref_id)
    VALUES (p_org_id, v_id, 'customer_created', 'Customer created from web chat', 'customer', v_id);
  ELSE
    UPDATE public.agent_contacts
    SET last_interaction_at = now(),
        name = coalesce(name, nullif(btrim(coalesce(p_name, '')), ''))
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.agent_resolve_webchat_customer(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_resolve_webchat_customer(uuid, text, text) TO service_role;