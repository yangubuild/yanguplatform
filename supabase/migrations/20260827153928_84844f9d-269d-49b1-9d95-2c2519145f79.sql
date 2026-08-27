ALTER TABLE public.agent_agents
  ADD COLUMN IF NOT EXISTS vapi_assistant_id text,
  ADD COLUMN IF NOT EXISTS vapi_phone_number_id text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS deployed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_deploy_error text;

CREATE UNIQUE INDEX IF NOT EXISTS agent_agents_vapi_assistant_id_key
  ON public.agent_agents (vapi_assistant_id) WHERE vapi_assistant_id IS NOT NULL;

ALTER TABLE public.agent_calls
  ADD COLUMN IF NOT EXISTS vapi_call_id text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS cost numeric,
  ADD COLUMN IF NOT EXISTS caller_id text,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS agent_calls_vapi_call_id_key
  ON public.agent_calls (vapi_call_id) WHERE vapi_call_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.agent_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'New agent setup',
  status text NOT NULL DEFAULT 'gathering',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_threads TO authenticated;
GRANT ALL ON public.agent_threads TO service_role;
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_threads_read ON public.agent_threads FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY agent_threads_insert ON public.agent_threads FOR INSERT TO authenticated
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']) AND user_id = auth.uid());
CREATE POLICY agent_threads_update ON public.agent_threads FOR UPDATE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));
CREATE POLICY agent_threads_delete ON public.agent_threads FOR DELETE TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));

CREATE TABLE IF NOT EXISTS public.agent_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.agent_threads(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_thread_messages_thread_idx
  ON public.agent_thread_messages (thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_thread_messages TO authenticated;
GRANT ALL ON public.agent_thread_messages TO service_role;
ALTER TABLE public.agent_thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_thread_messages_read ON public.agent_thread_messages FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY agent_thread_messages_write ON public.agent_thread_messages FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));

CREATE TABLE IF NOT EXISTS public.agent_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  vapi_phone_number_id text,
  provider text NOT NULL DEFAULT 'vapi',
  number text NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'available',
  agent_id uuid REFERENCES public.agent_agents(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_phone_numbers TO authenticated;
GRANT ALL ON public.agent_phone_numbers TO service_role;
ALTER TABLE public.agent_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_phone_numbers_read ON public.agent_phone_numbers FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY agent_phone_numbers_write ON public.agent_phone_numbers FOR ALL TO authenticated
  USING (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']))
  WITH CHECK (public.org_role_in(org_id, auth.uid(), ARRAY['owner','admin','editor']));

CREATE TRIGGER agent_threads_set_updated_at BEFORE UPDATE ON public.agent_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER agent_phone_numbers_set_updated_at BEFORE UPDATE ON public.agent_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();