
CREATE TABLE IF NOT EXISTS public.explore_manual_overrides (
  entity_id text PRIMARY KEY,
  position integer NOT NULL DEFAULT 0,
  set_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.explore_manual_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'explore_manual_overrides' AND policyname = 'Admins manage explore overrides'
  ) THEN
    CREATE POLICY "Admins manage explore overrides"
      ON public.explore_manual_overrides
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
