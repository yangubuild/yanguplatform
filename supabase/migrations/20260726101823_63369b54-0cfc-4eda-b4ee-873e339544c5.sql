
-- Phase 7: Real retrieval + LLM engine schema
CREATE EXTENSION IF NOT EXISTS vector;

-- Extend agent_knowledge_sources with processing state
ALTER TABLE public.agent_knowledge_sources
  ADD COLUMN IF NOT EXISTS text_content text,
  ADD COLUMN IF NOT EXISTS chunk_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS indexed_at timestamptz;

-- Org-scoped chunks table with 1536-dim embeddings (text-embedding-3-small)
CREATE TABLE IF NOT EXISTS public.agent_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.agent_knowledge_sources(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.agent_knowledge_collections(id) ON DELETE SET NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  language text,
  section text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_akc_source ON public.agent_knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_akc_org ON public.agent_knowledge_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_akc_embedding ON public.agent_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

GRANT SELECT ON public.agent_knowledge_chunks TO authenticated;
GRANT ALL ON public.agent_knowledge_chunks TO service_role;

ALTER TABLE public.agent_knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_kchunk_read" ON public.agent_knowledge_chunks
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
-- Writes only via service role (edge functions), so no write policy.

-- Retrieval RPC: search chunks scoped to an org, optionally filtered to
-- collections/sources permitted for a given agent.
CREATE OR REPLACE FUNCTION public.match_agent_chunks(
  p_org_id uuid,
  p_query vector(1536),
  p_source_ids uuid[] DEFAULT NULL,
  p_match_count integer DEFAULT 6,
  p_min_similarity float DEFAULT 0.0
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  collection_id uuid,
  content text,
  section text,
  language text,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.source_id, c.collection_id, c.content, c.section, c.language,
         1 - (c.embedding <=> p_query) AS similarity
  FROM public.agent_knowledge_chunks c
  JOIN public.agent_knowledge_sources s ON s.id = c.source_id
  WHERE c.org_id = p_org_id
    AND s.active = true
    AND s.status IN ('indexed', 'ready')
    AND (p_source_ids IS NULL OR c.source_id = ANY(p_source_ids))
    AND (1 - (c.embedding <=> p_query)) >= p_min_similarity
  ORDER BY c.embedding <=> p_query
  LIMIT GREATEST(p_match_count, 1);
$$;
GRANT EXECUTE ON FUNCTION public.match_agent_chunks(uuid, vector, uuid[], integer, float) TO authenticated, service_role;

-- Extend agent_usage_events with LLM cost/token fields (nullable, additive)
ALTER TABLE public.agent_usage_events
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS input_tokens integer,
  ADD COLUMN IF NOT EXISTS output_tokens integer,
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS decision text,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS retrieval_count integer,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS failure_reason text;
