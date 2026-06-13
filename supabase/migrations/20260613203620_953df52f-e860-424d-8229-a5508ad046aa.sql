CREATE OR REPLACE FUNCTION public.enforce_surface_type_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.surface_type IS DISTINCT FROM OLD.surface_type THEN
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION
        '[CATEGORY LOCK] surface_type is immutable after creation (was "%", attempted "%"). ADA may recommend switching categories but must create a new surface; only platform admins may override.',
        OLD.surface_type, NEW.surface_type
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_surface_type_lock ON public.builder_surfaces;

CREATE TRIGGER trg_enforce_surface_type_lock
BEFORE UPDATE OF surface_type ON public.builder_surfaces
FOR EACH ROW
EXECUTE FUNCTION public.enforce_surface_type_lock();