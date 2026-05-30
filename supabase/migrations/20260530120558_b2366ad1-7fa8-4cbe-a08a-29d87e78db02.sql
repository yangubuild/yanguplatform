
-- ============================================================
-- Phase 5: builder_surfaces + builder_publishes hardening
-- ============================================================

-- 1) Add columns to builder_surfaces ------------------------------------------
ALTER TABLE public.builder_surfaces
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS template_key text DEFAULT NULL;

-- CHECK constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'builder_surfaces_status_check'
  ) THEN
    ALTER TABLE public.builder_surfaces
      ADD CONSTRAINT builder_surfaces_status_check
      CHECK (status IN ('draft','published','archived','suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_builder_surfaces_status
  ON public.builder_surfaces(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_builder_surfaces_user_active
  ON public.builder_surfaces(user_id) WHERE deleted_at IS NULL;

-- 2) Backfill status = 'published' for surfaces with an active publish --------
UPDATE public.builder_surfaces s
   SET status = 'published'
  FROM public.builder_publishes p
 WHERE p.surface_id = s.id
   AND p.state = 'published'
   AND s.status = 'draft';

-- 3) Soft-delete trigger on builder_surfaces ----------------------------------
CREATE OR REPLACE FUNCTION public.builder_surfaces_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may hard delete; everyone else gets a soft delete.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN OLD;
  END IF;

  UPDATE public.builder_surfaces
     SET deleted_at = now(),
         status = CASE WHEN status = 'published' THEN 'archived' ELSE status END
   WHERE id = OLD.id;

  RETURN NULL; -- cancel the actual DELETE
END;
$$;

DROP TRIGGER IF EXISTS builder_surfaces_soft_delete_trg ON public.builder_surfaces;
CREATE TRIGGER builder_surfaces_soft_delete_trg
BEFORE DELETE ON public.builder_surfaces
FOR EACH ROW EXECUTE FUNCTION public.builder_surfaces_soft_delete();

-- 4) Block self-suspension on builder_surfaces --------------------------------
CREATE OR REPLACE FUNCTION public.builder_surfaces_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'suspended' AND OLD.status IS DISTINCT FROM 'suspended' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION '[YANGU LIFECYCLE] Only admins can suspend a surface';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS builder_surfaces_guard_status_trg ON public.builder_surfaces;
CREATE TRIGGER builder_surfaces_guard_status_trg
BEFORE UPDATE OF status ON public.builder_surfaces
FOR EACH ROW EXECUTE FUNCTION public.builder_surfaces_guard_status();

-- 5) Add columns to builder_publishes -----------------------------------------
ALTER TABLE public.builder_publishes
  ADD COLUMN IF NOT EXISTS html_snapshot_responsive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- published_at already exists and stays as-is (nullable timestamptz)

-- 6) Auto-increment version per surface_id on insert --------------------------
CREATE OR REPLACE FUNCTION public.builder_publishes_bump_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  next_v integer;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
    INTO next_v
    FROM public.builder_publishes
   WHERE surface_id = NEW.surface_id;
  NEW.version := next_v;
  IF NEW.published_at IS NULL AND NEW.state = 'published' THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS builder_publishes_bump_version_trg ON public.builder_publishes;
CREATE TRIGGER builder_publishes_bump_version_trg
BEFORE INSERT ON public.builder_publishes
FOR EACH ROW EXECUTE FUNCTION public.builder_publishes_bump_version();

-- 7) RLS policies on builder_surfaces -----------------------------------------
ALTER TABLE public.builder_surfaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can CRUD own builder surfaces" ON public.builder_surfaces;
DROP POLICY IF EXISTS "owner_select" ON public.builder_surfaces;
DROP POLICY IF EXISTS "owner_insert" ON public.builder_surfaces;
DROP POLICY IF EXISTS "owner_update" ON public.builder_surfaces;
DROP POLICY IF EXISTS "owner_delete" ON public.builder_surfaces;
DROP POLICY IF EXISTS "public_read_published" ON public.builder_surfaces;

CREATE POLICY "owner_select"
  ON public.builder_surfaces
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "owner_insert"
  ON public.builder_surfaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update"
  ON public.builder_surfaces
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- DELETE is allowed at the policy level so the soft-delete trigger fires;
-- the trigger cancels the actual delete for non-admins.
CREATE POLICY "owner_delete"
  ON public.builder_surfaces
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "public_read_published"
  ON public.builder_surfaces
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

-- 8) RLS policies on builder_publishes ----------------------------------------
ALTER TABLE public.builder_publishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage own publishes" ON public.builder_publishes;
DROP POLICY IF EXISTS "Anyone can read published pages" ON public.builder_publishes;
DROP POLICY IF EXISTS "owner_select" ON public.builder_publishes;
DROP POLICY IF EXISTS "owner_insert" ON public.builder_publishes;
DROP POLICY IF EXISTS "owner_update" ON public.builder_publishes;
DROP POLICY IF EXISTS "owner_delete" ON public.builder_publishes;
DROP POLICY IF EXISTS "public_read" ON public.builder_publishes;

CREATE POLICY "owner_select"
  ON public.builder_publishes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces s
     WHERE s.id = builder_publishes.surface_id
       AND s.user_id = auth.uid()
  ));

CREATE POLICY "owner_insert"
  ON public.builder_publishes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.builder_surfaces s
     WHERE s.id = builder_publishes.surface_id
       AND s.user_id = auth.uid()
  ));

CREATE POLICY "owner_update"
  ON public.builder_publishes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces s
     WHERE s.id = builder_publishes.surface_id
       AND s.user_id = auth.uid()
  ));

CREATE POLICY "owner_delete"
  ON public.builder_publishes
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces s
     WHERE s.id = builder_publishes.surface_id
       AND s.user_id = auth.uid()
  ));

CREATE POLICY "public_read"
  ON public.builder_publishes
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.builder_surfaces s
     WHERE s.id = builder_publishes.surface_id
       AND s.status = 'published'
       AND s.deleted_at IS NULL
  ));

-- 9) GRANTs (Data API) --------------------------------------------------------
GRANT SELECT ON public.builder_surfaces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_surfaces TO authenticated;
GRANT ALL ON public.builder_surfaces TO service_role;

GRANT SELECT ON public.builder_publishes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_publishes TO authenticated;
GRANT ALL ON public.builder_publishes TO service_role;
