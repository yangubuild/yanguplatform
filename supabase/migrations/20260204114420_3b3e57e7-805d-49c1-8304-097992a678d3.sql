-- PHASE 2 — Step 4f: Merge www domain publishes into canonical platform domains
-- Fixes: slug URLs return platform_home because publishes are stored under www domain_id

DO $$
DECLARE
  r record;
  canonical_host text;
  canonical_id uuid;
BEGIN
  FOR r IN
    SELECT id, host
    FROM public.domains
    WHERE kind = 'platform'
      AND host LIKE 'www.%'
  LOOP
    canonical_host := substring(r.host from 5); -- strip "www."
    
    SELECT d.id INTO canonical_id
    FROM public.domains d
    WHERE d.host = canonical_host
      AND d.kind = 'platform'
    LIMIT 1;

    -- If canonical row exists, move publishes from www domain_id → canonical domain_id
    IF canonical_id IS NOT NULL THEN
      UPDATE public.surface_publishes sp
      SET domain_id = canonical_id
      WHERE sp.domain_id = r.id;
    END IF;
  END LOOP;
END $$;