CREATE TABLE IF NOT EXISTS public.creatify_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preview_url TEXT,
  aspect_ratio TEXT,
  metadata JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creatify_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
ON public.creatify_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER set_creatify_templates_updated_at
BEFORE UPDATE ON public.creatify_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();