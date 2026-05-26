
ALTER TABLE public.developer_apps
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending_review';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developer_apps_review_status_check'
  ) THEN
    ALTER TABLE public.developer_apps
      ADD CONSTRAINT developer_apps_review_status_check
      CHECK (review_status IN ('pending_review','approved','rejected'));
  END IF;
END $$;

GRANT SELECT ON public.developer_apps TO anon;

DROP POLICY IF EXISTS "Anyone can view approved apps" ON public.developer_apps;
CREATE POLICY "Anyone can view approved apps"
ON public.developer_apps
FOR SELECT
USING (review_status = 'approved');
