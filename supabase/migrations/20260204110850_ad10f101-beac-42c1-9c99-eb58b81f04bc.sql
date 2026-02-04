-- PHASE 2 — Step 1 (Lovable): Upgrade public.domains for routing foundation (safe + idempotent)

DO $$
BEGIN
  -- 1) Add columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='kind'
  ) THEN
    ALTER TABLE public.domains ADD COLUMN kind text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='platform_key'
  ) THEN
    ALTER TABLE public.domains ADD COLUMN platform_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='points_to_surface_publish_id'
  ) THEN
    ALTER TABLE public.domains
      ADD COLUMN points_to_surface_publish_id uuid;
  END IF;

  -- 2) Add FK to surface_publishes if possible
  BEGIN
    ALTER TABLE public.domains
      ADD CONSTRAINT domains_points_to_surface_publish_id_fkey
      FOREIGN KEY (points_to_surface_publish_id)
      REFERENCES public.surface_publishes(id)
      ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- 3) Rename org_id -> owner_org_id if org_id exists and owner_org_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='org_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='owner_org_id'
  ) THEN
    ALTER TABLE public.domains RENAME COLUMN org_id TO owner_org_id;
  END IF;

  -- 4) Ensure owner_org_id is nullable (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='owner_org_id'
  ) THEN
    BEGIN
      ALTER TABLE public.domains ALTER COLUMN owner_org_id DROP NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  -- 5) Drop any old org FK constraints we can find (names vary)
  BEGIN
    ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS domains_org_id_fkey;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS domains_owner_org_id_fkey;
  EXCEPTION WHEN others THEN NULL; END;

  -- 6) Re-add owner_org_id FK pointing to whichever org table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='orgs'
  ) THEN
    BEGIN
      ALTER TABLE public.domains
        ADD CONSTRAINT domains_owner_org_id_fkey
        FOREIGN KEY (owner_org_id)
        REFERENCES public.orgs(id)
        ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='organizations'
  ) THEN
    BEGIN
      ALTER TABLE public.domains
        ADD CONSTRAINT domains_owner_org_id_fkey
        FOREIGN KEY (owner_org_id)
        REFERENCES public.organizations(id)
        ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;

  -- 7) Add CHECK constraints (safe if already exist)
  BEGIN
    ALTER TABLE public.domains
      ADD CONSTRAINT domains_kind_check CHECK (kind IN ('platform','custom'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER TABLE public.domains
      ADD CONSTRAINT domains_platform_key_check
      CHECK (platform_key IS NULL OR platform_key IN ('io','community','site','studio','shop','store','live'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- 8) Ensure host unique index exists
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS domains_host_unique ON public.domains(host)';

  -- 9) Migrate existing rows (best-effort)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='domain_type'
  ) THEN
    UPDATE public.domains
    SET kind = COALESCE(kind, 'platform'),
        platform_key = COALESCE(platform_key, domain_type::text)
    WHERE host LIKE 'yangu.%';
  END IF;

  -- Any remaining null kind becomes custom
  UPDATE public.domains SET kind='custom' WHERE kind IS NULL;

  -- kind must be not null now
  ALTER TABLE public.domains ALTER COLUMN kind SET NOT NULL;

  -- 10) Seed live platform domains (upsert) - include domain_type for NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='is_active'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='domain_type'
  ) THEN
    INSERT INTO public.domains (host, domain_type, kind, platform_key, owner_org_id, is_active)
    VALUES
      ('yangu.community','community','platform','community',NULL,true),
      ('yangu.site','site','platform','site',NULL,true)
    ON CONFLICT (host) DO UPDATE
      SET kind='platform', platform_key=EXCLUDED.platform_key, is_active=true;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='domain_type'
  ) THEN
    INSERT INTO public.domains (host, domain_type, kind, platform_key, owner_org_id)
    VALUES
      ('yangu.community','community','platform','community',NULL),
      ('yangu.site','site','platform','site',NULL)
    ON CONFLICT (host) DO UPDATE
      SET kind='platform', platform_key=EXCLUDED.platform_key;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='domains' AND column_name='is_active'
  ) THEN
    INSERT INTO public.domains (host, kind, platform_key, owner_org_id, is_active)
    VALUES
      ('yangu.community','platform','community',NULL,true),
      ('yangu.site','platform','site',NULL,true)
    ON CONFLICT (host) DO UPDATE
      SET kind='platform', platform_key=EXCLUDED.platform_key, is_active=true;
  ELSE
    INSERT INTO public.domains (host, kind, platform_key, owner_org_id)
    VALUES
      ('yangu.community','platform','community',NULL),
      ('yangu.site','platform','site',NULL)
    ON CONFLICT (host) DO UPDATE
      SET kind='platform', platform_key=EXCLUDED.platform_key;
  END IF;
END $$;