
-- 1) external_publications table
CREATE TABLE IF NOT EXISTS public.external_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT,
  published_at TIMESTAMPTZ,
  image_url TEXT,
  image_source TEXT NOT NULL DEFAULT 'anthropic',
  excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.external_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for anthropic_research"
ON public.external_publications FOR SELECT
USING (source_key = 'anthropic_research');

CREATE POLICY "Admins can manage external_publications"
ON public.external_publications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast ordered queries
CREATE INDEX idx_external_publications_source_published
ON public.external_publications (source_key, published_at DESC NULLS LAST, created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_external_publications_updated_at
BEFORE UPDATE ON public.external_publications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RPC function
CREATE OR REPLACE FUNCTION public.get_anthropic_publications(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  image_url TEXT,
  category TEXT,
  image_source TEXT,
  excerpt TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ep.id,
    ep.title,
    ep.url,
    ep.published_at,
    ep.image_url,
    ep.category,
    ep.image_source,
    ep.excerpt
  FROM public.external_publications ep
  WHERE ep.source_key = 'anthropic_research'
  ORDER BY ep.published_at DESC NULLS LAST, ep.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
