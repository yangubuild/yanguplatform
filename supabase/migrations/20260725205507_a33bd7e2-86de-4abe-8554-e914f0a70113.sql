
-- ============================================================
-- AI Agents — Phase 5 persistence
-- ============================================================

-- Extend org_memberships to allow operator/analyst
ALTER TABLE public.org_memberships DROP CONSTRAINT IF EXISTS org_memberships_role_check;
ALTER TABLE public.org_memberships ADD CONSTRAINT org_memberships_role_check
  CHECK (role IN ('owner','admin','editor','viewer','operator','analyst'));

-- Helper: is user a member of an org
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE org_id = _org_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.orgs WHERE id = _org_id AND owner_user_id = _user_id
  );
$$;

-- Helper: does user have any of the specified roles in this org (owner counts as owner)
CREATE OR REPLACE FUNCTION public.org_role_in(_org_id uuid, _user_id uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.orgs
      WHERE id = _org_id AND owner_user_id = _user_id AND 'owner' = ANY(_roles)
    )
    OR EXISTS (
      SELECT 1 FROM public.org_memberships
      WHERE org_id = _org_id AND user_id = _user_id AND role = ANY(_roles)
    )
    OR public.has_role(_user_id, 'admin'::app_role);
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- Common role sets used by policies:
--   manage: owner, admin, editor           (full write)
--   ops:    owner, admin, editor, operator (operational write)
--   read:   any member (incl. analyst, viewer, operator)
-- ============================================================

-- ─── agent_agents ───────────────────────────────────────────
CREATE TABLE public.agent_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'support',
  status text NOT NULL DEFAULT 'draft',
  description text,
  channels text[] NOT NULL DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  voice text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_agents TO authenticated;
GRANT ALL ON public.agent_agents TO service_role;
ALTER TABLE public.agent_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_agents_read" ON public.agent_agents FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_agents_write" ON public.agent_agents FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE POLICY "agent_agents_update" ON public.agent_agents FOR UPDATE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE POLICY "agent_agents_delete" ON public.agent_agents FOR DELETE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_agent_agents_uat BEFORE UPDATE ON public.agent_agents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_agents_org ON public.agent_agents(org_id);

-- ─── agent_configs ──────────────────────────────────────────
CREATE TABLE public.agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_agents(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'draft' CHECK (environment IN ('draft','staging','live')),
  version integer NOT NULL DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, environment, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_configs TO authenticated;
GRANT ALL ON public.agent_configs TO service_role;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_configs_read" ON public.agent_configs FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_configs_write" ON public.agent_configs FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE TRIGGER trg_agent_configs_uat BEFORE UPDATE ON public.agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_configs_agent ON public.agent_configs(agent_id);

-- ─── agent_contacts ─────────────────────────────────────────
CREATE TABLE public.agent_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text,
  channel text,
  language text,
  email text,
  phone text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_contacts TO authenticated;
GRANT ALL ON public.agent_contacts TO service_role;
ALTER TABLE public.agent_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_contacts_read" ON public.agent_contacts FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_contacts_write" ON public.agent_contacts FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE TRIGGER trg_agent_contacts_uat BEFORE UPDATE ON public.agent_contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_contacts_org ON public.agent_contacts(org_id);

-- ─── agent_conversations ────────────────────────────────────
CREATE TABLE public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.agent_contacts(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'web',
  status text NOT NULL DEFAULT 'new',
  priority text DEFAULT 'normal',
  sentiment text,
  language text,
  outcome text DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  takeover_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  takeover_at timestamptz,
  returned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  returned_at timestamptz,
  handover_summary text,
  tags text[] NOT NULL DEFAULT '{}',
  memory_retention text,
  spam boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  unread integer NOT NULL DEFAULT 0,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_conversations TO authenticated;
GRANT ALL ON public.agent_conversations TO service_role;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_conversations_read" ON public.agent_conversations FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_conversations_write" ON public.agent_conversations FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE TRIGGER trg_agent_conversations_uat BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_conversations_org ON public.agent_conversations(org_id, updated_at DESC);
CREATE INDEX idx_agent_conversations_agent ON public.agent_conversations(agent_id);

-- ─── agent_messages ─────────────────────────────────────────
CREATE TABLE public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer','agent','human','system')),
  text text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_messages_read" ON public.agent_messages FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_messages_insert" ON public.agent_messages FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
-- messages are append-only for humans; admins/owners may correct
CREATE POLICY "agent_messages_update_admin" ON public.agent_messages FOR UPDATE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "agent_messages_delete_admin" ON public.agent_messages FOR DELETE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE INDEX idx_agent_messages_conv ON public.agent_messages(conversation_id, at);

-- ─── agent_conversation_notes ───────────────────────────────
CREATE TABLE public.agent_conversation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  text text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_conversation_notes TO authenticated;
GRANT ALL ON public.agent_conversation_notes TO service_role;
ALTER TABLE public.agent_conversation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_notes_read" ON public.agent_conversation_notes FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_notes_write" ON public.agent_conversation_notes FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE POLICY "agent_notes_update_own" ON public.agent_conversation_notes FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid() OR public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (author_user_id = auth.uid() OR public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "agent_notes_delete_own" ON public.agent_conversation_notes FOR DELETE TO authenticated
  USING (author_user_id = auth.uid() OR public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE INDEX idx_agent_notes_conv ON public.agent_conversation_notes(conversation_id, at DESC);

-- ─── agent_handover_events (append-only) ────────────────────
CREATE TABLE public.agent_handover_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('takeover','return','escalation')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  summary text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agent_handover_events TO authenticated;
GRANT ALL ON public.agent_handover_events TO service_role;
ALTER TABLE public.agent_handover_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_handover_read" ON public.agent_handover_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_handover_insert" ON public.agent_handover_events FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE INDEX idx_agent_handover_conv ON public.agent_handover_events(conversation_id, at DESC);

-- ─── agent_leads ────────────────────────────────────────────
CREATE TABLE public.agent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.agent_contacts(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text, phone text,
  source text,
  intent text,
  score integer NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'new',
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_leads TO authenticated;
GRANT ALL ON public.agent_leads TO service_role;
ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_leads_read" ON public.agent_leads FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_leads_write" ON public.agent_leads FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE TRIGGER trg_agent_leads_uat BEFORE UPDATE ON public.agent_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_leads_org ON public.agent_leads(org_id, created_at DESC);

-- ─── agent_appointments ─────────────────────────────────────
CREATE TABLE public.agent_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.agent_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  contact_name text,
  channel text,
  scheduled_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_appointments TO authenticated;
GRANT ALL ON public.agent_appointments TO service_role;
ALTER TABLE public.agent_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_appts_read" ON public.agent_appointments FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_appts_write" ON public.agent_appointments FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE TRIGGER trg_agent_appts_uat BEFORE UPDATE ON public.agent_appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_appts_org ON public.agent_appointments(org_id, scheduled_at);

-- ─── agent_calls ────────────────────────────────────────────
CREATE TABLE public.agent_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.agent_contacts(id) ON DELETE SET NULL,
  contact_name text,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  duration_sec integer NOT NULL DEFAULT 0,
  outcome text,
  recording_url text,
  transcript text,
  started_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_calls TO authenticated;
GRANT ALL ON public.agent_calls TO service_role;
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_calls_read" ON public.agent_calls FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_calls_write" ON public.agent_calls FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE TRIGGER trg_agent_calls_uat BEFORE UPDATE ON public.agent_calls
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_calls_org ON public.agent_calls(org_id, started_at DESC);

-- ─── agent_knowledge_collections ────────────────────────────
CREATE TABLE public.agent_knowledge_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT 'sky',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_knowledge_collections TO authenticated;
GRANT ALL ON public.agent_knowledge_collections TO service_role;
ALTER TABLE public.agent_knowledge_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_kcoll_read" ON public.agent_knowledge_collections FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_kcoll_write" ON public.agent_knowledge_collections FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE TRIGGER trg_agent_kcoll_uat BEFORE UPDATE ON public.agent_knowledge_collections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ─── agent_knowledge_sources ────────────────────────────────
CREATE TABLE public.agent_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.agent_knowledge_collections(id) ON DELETE SET NULL,
  name text NOT NULL,
  kind text NOT NULL,
  language text DEFAULT 'en',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'processing',
  size text,
  active boolean NOT NULL DEFAULT true,
  permission text NOT NULL DEFAULT 'all',
  source_url text,
  tags text[] NOT NULL DEFAULT '{}',
  chunks integer NOT NULL DEFAULT 0,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_knowledge_sources TO authenticated;
GRANT ALL ON public.agent_knowledge_sources TO service_role;
ALTER TABLE public.agent_knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_ksrc_read" ON public.agent_knowledge_sources FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_ksrc_write" ON public.agent_knowledge_sources FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE TRIGGER trg_agent_ksrc_uat BEFORE UPDATE ON public.agent_knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_agent_ksrc_org ON public.agent_knowledge_sources(org_id);
CREATE INDEX idx_agent_ksrc_coll ON public.agent_knowledge_sources(collection_id);

-- ─── agent_knowledge_assignments (agent<->source) ───────────
CREATE TABLE public.agent_knowledge_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_agents(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.agent_knowledge_sources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, source_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_knowledge_assignments TO authenticated;
GRANT ALL ON public.agent_knowledge_assignments TO service_role;
ALTER TABLE public.agent_knowledge_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_kassign_read" ON public.agent_knowledge_assignments FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_kassign_write" ON public.agent_knowledge_assignments FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));

-- ─── agent_workflows ────────────────────────────────────────
CREATE TABLE public.agent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  name text NOT NULL,
  trigger text,
  status text NOT NULL DEFAULT 'draft',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  runs integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_workflows TO authenticated;
GRANT ALL ON public.agent_workflows TO service_role;
ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_wf_read" ON public.agent_workflows FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_wf_write" ON public.agent_workflows FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE TRIGGER trg_agent_wf_uat BEFORE UPDATE ON public.agent_workflows
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ─── agent_integrations ─────────────────────────────────────
CREATE TABLE public.agent_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  connected boolean NOT NULL DEFAULT false,
  icon text,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_integrations TO authenticated;
GRANT ALL ON public.agent_integrations TO service_role;
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_int_read" ON public.agent_integrations FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
-- Integrations are managed by owner/admin only (security-sensitive)
CREATE POLICY "agent_int_write" ON public.agent_integrations FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_agent_int_uat BEFORE UPDATE ON public.agent_integrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ─── agent_usage_events (append-only) ───────────────────────
CREATE TABLE public.agent_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  units numeric NOT NULL DEFAULT 1,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agent_usage_events TO authenticated;
GRANT ALL ON public.agent_usage_events TO service_role;
ALTER TABLE public.agent_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_usage_read" ON public.agent_usage_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "agent_usage_insert" ON public.agent_usage_events FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor','operator']));
CREATE INDEX idx_agent_usage_org ON public.agent_usage_events(org_id, at DESC);

-- ─── agent_audit_logs (append-only) ─────────────────────────
CREATE TABLE public.agent_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agent_audit_logs TO authenticated;
GRANT ALL ON public.agent_audit_logs TO service_role;
ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_audit_read" ON public.agent_audit_logs FOR SELECT TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','analyst']));
CREATE POLICY "agent_audit_insert" ON public.agent_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()));
CREATE INDEX idx_agent_audit_org ON public.agent_audit_logs(org_id, at DESC);
