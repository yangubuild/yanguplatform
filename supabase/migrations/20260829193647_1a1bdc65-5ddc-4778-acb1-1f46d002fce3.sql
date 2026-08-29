-- ============ 1. Extend canonical customer profile (reuse agent_contacts) ============
ALTER TABLE public.agent_contacts
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_e164 text;

-- ============ 2. Phone normalization ============
CREATE OR REPLACE FUNCTION public.agent_normalize_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE d text;
BEGIN
  IF p_phone IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  IF d LIKE '00%' THEN d := '+' || substring(d from 3); END IF;
  d := regexp_replace(d, '(?<=.)\+', '', 'g');
  IF d NOT LIKE '+%' THEN d := '+' || d; END IF;
  -- reject clearly incomplete numbers rather than creating bad identities
  IF length(regexp_replace(d, '[^0-9]', '', 'g')) < 8 THEN RETURN NULL; END IF;
  RETURN d;
END;
$$;

CREATE OR REPLACE FUNCTION public.agent_normalize_email(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_email IS NULL THEN NULL
    WHEN position('@' in btrim(p_email)) < 2 THEN NULL
    ELSE lower(btrim(p_email))
  END;
$$;

-- keep normalized phone in sync
CREATE OR REPLACE FUNCTION public.agent_contacts_normalize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone_e164 := public.agent_normalize_phone(NEW.phone);
  NEW.email := public.agent_normalize_email(NEW.email);
  IF NEW.name IS NULL AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
    NEW.name := btrim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,''));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_contacts_normalize_trg ON public.agent_contacts;
CREATE TRIGGER agent_contacts_normalize_trg
BEFORE INSERT OR UPDATE ON public.agent_contacts
FOR EACH ROW EXECUTE FUNCTION public.agent_contacts_normalize();

UPDATE public.agent_contacts
SET phone_e164 = public.agent_normalize_phone(phone)
WHERE phone_e164 IS NULL AND phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_contacts_org_phone_idx ON public.agent_contacts (org_id, phone_e164);
CREATE INDEX IF NOT EXISTS agent_contacts_org_email_idx ON public.agent_contacts (org_id, email);

-- ============ 3. Customer identities ============
CREATE TABLE IF NOT EXISTS public.agent_customer_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.agent_contacts(id) ON DELETE CASCADE,
  identity_type text NOT NULL CHECK (identity_type IN ('phone','email','whatsapp','sms','webchat','external')),
  identity_value text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  source text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, identity_type, identity_value)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_customer_identities TO authenticated;
GRANT ALL ON public.agent_customer_identities TO service_role;
ALTER TABLE public.agent_customer_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_customer_identities_read ON public.agent_customer_identities
FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY agent_customer_identities_write ON public.agent_customer_identities
FOR ALL TO authenticated
USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));

CREATE INDEX IF NOT EXISTS agent_customer_identities_contact_idx ON public.agent_customer_identities (contact_id);

-- ============ 4. Customer memory ============
CREATE TABLE IF NOT EXISTS public.agent_customer_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.agent_contacts(id) ON DELETE CASCADE,
  memory_type text NOT NULL DEFAULT 'fact'
    CHECK (memory_type IN ('preference','fact','request','issue','product_interest','appointment_context','relationship','channel_preference','unresolved')),
  memory_key text,
  content text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.7 CHECK (confidence >= 0 AND confidence <= 1),
  source_type text CHECK (source_type IN ('call','conversation','lead','appointment','manual','import')),
  source_id uuid,
  agent_id uuid,
  created_by uuid,
  last_used_at timestamptz,
  expires_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_customer_memories TO authenticated;
GRANT ALL ON public.agent_customer_memories TO service_role;
ALTER TABLE public.agent_customer_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_customer_memories_read ON public.agent_customer_memories
FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY agent_customer_memories_write ON public.agent_customer_memories
FOR ALL TO authenticated
USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));

CREATE UNIQUE INDEX IF NOT EXISTS agent_customer_memories_key_uq
  ON public.agent_customer_memories (contact_id, memory_type, memory_key)
  WHERE memory_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_customer_memories_contact_idx
  ON public.agent_customer_memories (contact_id, updated_at DESC);

-- ============ 5. Customer timeline (references, no duplication) ============
CREATE TABLE IF NOT EXISTS public.agent_customer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.agent_contacts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text,
  ref_type text CHECK (ref_type IN ('call','conversation','message','lead','appointment','memory','agent','customer')),
  ref_id uuid,
  agent_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.agent_customer_events TO authenticated;
GRANT ALL ON public.agent_customer_events TO service_role;
ALTER TABLE public.agent_customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_customer_events_read ON public.agent_customer_events
FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY agent_customer_events_insert ON public.agent_customer_events
FOR INSERT TO authenticated
WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));

CREATE INDEX IF NOT EXISTS agent_customer_events_contact_idx
  ON public.agent_customer_events (contact_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS agent_customer_events_dedupe_uq
  ON public.agent_customer_events (contact_id, event_type, ref_type, ref_id)
  WHERE ref_id IS NOT NULL;

-- ============ 6. Identity resolution (deterministic only) ============
CREATE OR REPLACE FUNCTION public.agent_resolve_customer(
  p_org_id uuid,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_create boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := public.agent_normalize_phone(p_phone);
  v_email text := public.agent_normalize_email(p_email);
  v_id uuid;
BEGIN
  IF p_org_id IS NULL THEN RETURN NULL; END IF;

  -- strong signal 1: known identity record
  IF v_phone IS NOT NULL THEN
    SELECT contact_id INTO v_id FROM public.agent_customer_identities
    WHERE org_id = p_org_id AND identity_type IN ('phone','whatsapp','sms') AND identity_value = v_phone
    LIMIT 1;
  END IF;

  -- strong signal 2: email identity
  IF v_id IS NULL AND v_email IS NOT NULL THEN
    SELECT contact_id INTO v_id FROM public.agent_customer_identities
    WHERE org_id = p_org_id AND identity_type = 'email' AND identity_value = v_email
    LIMIT 1;
  END IF;

  -- strong signal 3: existing contact profile match
  IF v_id IS NULL AND v_phone IS NOT NULL THEN
    SELECT id INTO v_id FROM public.agent_contacts
    WHERE org_id = p_org_id AND phone_e164 = v_phone ORDER BY created_at LIMIT 1;
  END IF;
  IF v_id IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_id FROM public.agent_contacts
    WHERE org_id = p_org_id AND email = v_email ORDER BY created_at LIMIT 1;
  END IF;

  -- name alone is NEVER a match signal
  IF v_id IS NULL THEN
    IF NOT p_create OR (v_phone IS NULL AND v_email IS NULL) THEN
      RETURN NULL;
    END IF;
    INSERT INTO public.agent_contacts (org_id, name, phone, email, channel, source, last_interaction_at)
    VALUES (p_org_id, nullif(btrim(coalesce(p_name,'')),''), v_phone, v_email, p_channel, p_channel, now())
    RETURNING id INTO v_id;

    INSERT INTO public.agent_customer_events (org_id, contact_id, event_type, title, ref_type, ref_id)
    VALUES (p_org_id, v_id, 'customer_created', 'Customer created', 'customer', v_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.agent_audit_logs (org_id, actor_user_id, action, entity_type, entity_id, meta)
    VALUES (p_org_id, auth.uid(), 'customer_created', 'customer', v_id,
            jsonb_build_object('channel', p_channel, 'matched_on', 'new'));
  ELSE
    UPDATE public.agent_contacts
    SET last_interaction_at = now(),
        phone = coalesce(phone, v_phone),
        email = coalesce(email, v_email),
        name = coalesce(name, nullif(btrim(coalesce(p_name,'')),''))
    WHERE id = v_id;
  END IF;

  -- record identities (idempotent)
  IF v_phone IS NOT NULL THEN
    INSERT INTO public.agent_customer_identities (org_id, contact_id, identity_type, identity_value, is_verified, source)
    VALUES (p_org_id, v_id, CASE WHEN p_channel = 'whatsapp' THEN 'whatsapp' ELSE 'phone' END, v_phone, true, p_channel)
    ON CONFLICT (org_id, identity_type, identity_value) DO NOTHING;
  END IF;
  IF v_email IS NOT NULL THEN
    INSERT INTO public.agent_customer_identities (org_id, contact_id, identity_type, identity_value, is_verified, source)
    VALUES (p_org_id, v_id, 'email', v_email, false, p_channel)
    ON CONFLICT (org_id, identity_type, identity_value) DO NOTHING;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.agent_resolve_customer(uuid,text,text,text,text,boolean) FROM public;

-- callers must be members of the org: wrapper enforcing authorization
CREATE OR REPLACE FUNCTION public.agent_resolve_customer_for_org(
  p_org_id uuid,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_channel text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.org_role_in(p_org_id, auth.uid(), ARRAY['owner','admin','editor','operator']) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN public.agent_resolve_customer(p_org_id, p_phone, p_email, p_name, p_channel, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_resolve_customer_for_org(uuid,text,text,text,text) TO authenticated;

-- ============ 7. Auto-link existing modules ============
CREATE OR REPLACE FUNCTION public.agent_link_call_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_num text;
BEGIN
  v_num := CASE WHEN NEW.direction = 'inbound' THEN NEW.caller_id ELSE NEW.destination END;
  IF NEW.contact_id IS NULL THEN
    NEW.contact_id := public.agent_resolve_customer(NEW.org_id, v_num, NULL, NEW.contact_name, 'phone', true);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_calls_link_customer_trg ON public.agent_calls;
CREATE TRIGGER agent_calls_link_customer_trg
BEFORE INSERT ON public.agent_calls
FOR EACH ROW EXECUTE FUNCTION public.agent_link_call_customer();

CREATE OR REPLACE FUNCTION public.agent_timeline_from_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_title text;
  v_at timestamptz := now();
BEGIN
  IF NEW.contact_id IS NULL THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'agent_calls' THEN
    v_type := CASE WHEN NEW.status IN ('completed','ended') THEN 'call_completed' ELSE 'call_started' END;
    v_title := initcap(coalesce(NEW.direction,'')) || ' call';
    v_at := coalesce(NEW.started_at, now());
  ELSIF TG_TABLE_NAME = 'agent_conversations' THEN
    v_type := 'conversation_started';
    v_title := 'Conversation on ' || coalesce(NEW.channel,'unknown');
  ELSIF TG_TABLE_NAME = 'agent_leads' THEN
    v_type := 'lead_created';
    v_title := 'Lead created';
  ELSIF TG_TABLE_NAME = 'agent_appointments' THEN
    v_type := CASE WHEN TG_OP = 'INSERT' THEN 'appointment_booked' ELSE 'appointment_changed' END;
    v_title := coalesce(NEW.title, 'Appointment');
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.agent_customer_events (org_id, contact_id, event_type, title, ref_type, ref_id, agent_id, occurred_at)
  VALUES (
    NEW.org_id, NEW.contact_id, v_type, v_title,
    CASE TG_TABLE_NAME
      WHEN 'agent_calls' THEN 'call'
      WHEN 'agent_conversations' THEN 'conversation'
      WHEN 'agent_leads' THEN 'lead'
      ELSE 'appointment' END,
    NEW.id,
    CASE WHEN TG_TABLE_NAME = 'agent_leads' THEN NULL ELSE NEW.agent_id END,
    v_at
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.agent_contacts SET last_interaction_at = greatest(coalesce(last_interaction_at, v_at), v_at)
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_calls_timeline_trg ON public.agent_calls;
CREATE TRIGGER agent_calls_timeline_trg
AFTER INSERT OR UPDATE OF status ON public.agent_calls
FOR EACH ROW EXECUTE FUNCTION public.agent_timeline_from_record();

DROP TRIGGER IF EXISTS agent_conversations_timeline_trg ON public.agent_conversations;
CREATE TRIGGER agent_conversations_timeline_trg
AFTER INSERT ON public.agent_conversations
FOR EACH ROW EXECUTE FUNCTION public.agent_timeline_from_record();

DROP TRIGGER IF EXISTS agent_leads_timeline_trg ON public.agent_leads;
CREATE TRIGGER agent_leads_timeline_trg
AFTER INSERT ON public.agent_leads
FOR EACH ROW EXECUTE FUNCTION public.agent_timeline_from_record();

DROP TRIGGER IF EXISTS agent_appointments_timeline_trg ON public.agent_appointments;
CREATE TRIGGER agent_appointments_timeline_trg
AFTER INSERT OR UPDATE OF scheduled_at, status ON public.agent_appointments
FOR EACH ROW EXECUTE FUNCTION public.agent_timeline_from_record();

-- ============ 8. Memory write/read APIs with audit logging ============
CREATE OR REPLACE FUNCTION public.agent_save_customer_memory(
  p_contact_id uuid,
  p_memory_type text,
  p_content text,
  p_memory_key text DEFAULT NULL,
  p_confidence numeric DEFAULT 0.7,
  p_source_type text DEFAULT 'manual',
  p_source_id uuid DEFAULT NULL,
  p_agent_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_id uuid;
  v_existing uuid;
BEGIN
  SELECT org_id INTO v_org FROM public.agent_contacts WHERE id = p_contact_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'customer_not_found'; END IF;
  IF NOT public.org_role_in(v_org, auth.uid(), ARRAY['owner','admin','editor','operator']) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_content IS NULL OR btrim(p_content) = '' THEN RAISE EXCEPTION 'empty_memory'; END IF;

  IF p_memory_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.agent_customer_memories
    WHERE contact_id = p_contact_id AND memory_type = p_memory_type AND memory_key = p_memory_key;
  END IF;

  IF v_existing IS NOT NULL THEN
    UPDATE public.agent_customer_memories
    SET content = p_content, confidence = p_confidence, source_type = p_source_type,
        source_id = p_source_id, agent_id = p_agent_id, updated_at = now()
    WHERE id = v_existing RETURNING id INTO v_id;

    INSERT INTO public.agent_audit_logs (org_id, actor_user_id, action, entity_type, entity_id, meta)
    VALUES (v_org, auth.uid(), 'memory_updated', 'customer_memory', v_id,
            jsonb_build_object('memory_type', p_memory_type, 'customer_id', p_contact_id));
  ELSE
    INSERT INTO public.agent_customer_memories
      (org_id, contact_id, memory_type, memory_key, content, confidence, source_type, source_id, agent_id, created_by)
    VALUES (v_org, p_contact_id, p_memory_type, p_memory_key, p_content, p_confidence, p_source_type, p_source_id, p_agent_id, auth.uid())
    RETURNING id INTO v_id;

    INSERT INTO public.agent_audit_logs (org_id, actor_user_id, action, entity_type, entity_id, meta)
    VALUES (v_org, auth.uid(), 'memory_created', 'customer_memory', v_id,
            jsonb_build_object('memory_type', p_memory_type, 'customer_id', p_contact_id));

    INSERT INTO public.agent_customer_events (org_id, contact_id, event_type, title, ref_type, ref_id, agent_id)
    VALUES (v_org, p_contact_id, 'memory_created', 'Customer memory saved', 'memory', v_id, p_agent_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_save_customer_memory(uuid,text,text,text,numeric,text,uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.agent_delete_customer_memory(p_memory_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org uuid; v_contact uuid; v_type text;
BEGIN
  SELECT org_id, contact_id, memory_type INTO v_org, v_contact, v_type
  FROM public.agent_customer_memories WHERE id = p_memory_id;
  IF v_org IS NULL THEN RETURN; END IF;
  IF NOT public.org_role_in(v_org, auth.uid(), ARRAY['owner','admin','editor','operator']) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.agent_customer_memories WHERE id = p_memory_id;
  INSERT INTO public.agent_audit_logs (org_id, actor_user_id, action, entity_type, entity_id, meta)
  VALUES (v_org, auth.uid(), 'memory_deleted', 'customer_memory', p_memory_id,
          jsonb_build_object('memory_type', v_type, 'customer_id', v_contact));
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_delete_customer_memory(uuid) TO authenticated;

-- relevance + recency ordered context for agents (no full history dump)
CREATE OR REPLACE FUNCTION public.agent_get_customer_context(
  p_contact_id uuid,
  p_memory_limit integer DEFAULT 8,
  p_event_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE v_org uuid; v_result jsonb;
BEGIN
  SELECT org_id INTO v_org FROM public.agent_contacts WHERE id = p_contact_id;
  IF v_org IS NULL THEN RETURN NULL; END IF;
  IF NOT public.is_org_member(v_org, auth.uid()) THEN RAISE EXCEPTION 'not_authorized'; END IF;

  SELECT jsonb_build_object(
    'customer', (SELECT jsonb_build_object(
        'id', c.id, 'name', c.name, 'first_name', c.first_name, 'company', c.company,
        'job_title', c.job_title, 'language', c.language, 'timezone', c.timezone,
        'status', c.status, 'tags', c.tags, 'last_interaction_at', c.last_interaction_at)
      FROM public.agent_contacts c WHERE c.id = p_contact_id),
    'memories', coalesce((SELECT jsonb_agg(m) FROM (
        SELECT memory_type, memory_key, content, confidence, updated_at
        FROM public.agent_customer_memories
        WHERE contact_id = p_contact_id
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY confidence DESC, updated_at DESC
        LIMIT greatest(p_memory_limit, 1)) m), '[]'::jsonb),
    'recent_events', coalesce((SELECT jsonb_agg(e) FROM (
        SELECT event_type, title, ref_type, ref_id, occurred_at
        FROM public.agent_customer_events
        WHERE contact_id = p_contact_id
        ORDER BY occurred_at DESC
        LIMIT greatest(p_event_limit, 1)) e), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_get_customer_context(uuid,integer,integer) TO authenticated;

-- ============ 9. Safe backfill of customer links for existing records ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, org_id, direction, caller_id, destination, contact_name
           FROM public.agent_calls WHERE contact_id IS NULL LOOP
    UPDATE public.agent_calls
    SET contact_id = public.agent_resolve_customer(
      r.org_id,
      CASE WHEN r.direction = 'inbound' THEN r.caller_id ELSE r.destination END,
      NULL, r.contact_name, 'phone', true)
    WHERE id = r.id;
  END LOOP;

  FOR r IN SELECT id, org_id, phone, email, name FROM public.agent_leads WHERE contact_id IS NULL LOOP
    UPDATE public.agent_leads
    SET contact_id = public.agent_resolve_customer(r.org_id, r.phone, r.email, r.name, 'lead', true)
    WHERE id = r.id;
  END LOOP;
END $$;