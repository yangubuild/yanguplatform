
-- 1. citext + allowlist table
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.dashboard_allowlist (
  email      citext PRIMARY KEY,
  added_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dashboard_allowlist TO authenticated;
GRANT ALL    ON public.dashboard_allowlist TO service_role;

ALTER TABLE public.dashboard_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage dashboard allowlist" ON public.dashboard_allowlist;
CREATE POLICY "Admins manage dashboard allowlist"
  ON public.dashboard_allowlist
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can read their own allowlist row" ON public.dashboard_allowlist;
CREATE POLICY "Users can read their own allowlist row"
  ON public.dashboard_allowlist
  FOR SELECT
  TO authenticated
  USING (email = (SELECT u.email::citext FROM auth.users u WHERE u.id = auth.uid()));

-- Seed
INSERT INTO public.dashboard_allowlist (email, note)
VALUES
  ('kafeeroAz@gmail.com', 'Initial allowlisted owner'),
  ('yanguabuild@gmail.com', 'Initial allowlisted builder')
ON CONFLICT (email) DO NOTHING;

-- 2. Allowlist check function
CREATE OR REPLACE FUNCTION public.is_dashboard_allowed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dashboard_allowlist a
    JOIN auth.users u ON u.email::citext = a.email
    WHERE u.id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_dashboard_allowed(uuid) TO authenticated, anon, service_role;

-- 3. RLS — add allowlist gate to non-admin write policies (do NOT touch SELECT)

-- builder_surfaces
DROP POLICY IF EXISTS owner_insert ON public.builder_surfaces;
CREATE POLICY owner_insert ON public.builder_surfaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_dashboard_allowed(auth.uid()));

DROP POLICY IF EXISTS owner_update ON public.builder_surfaces;
CREATE POLICY owner_update ON public.builder_surfaces
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL AND public.is_dashboard_allowed(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_dashboard_allowed(auth.uid()));

DROP POLICY IF EXISTS owner_delete ON public.builder_surfaces;
CREATE POLICY owner_delete ON public.builder_surfaces
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.is_dashboard_allowed(auth.uid()));

-- builder_pages: split ALL into SELECT (unchanged) + write (gated)
DROP POLICY IF EXISTS "Owners can CRUD own builder pages" ON public.builder_pages;
CREATE POLICY "Owners can read own builder pages"
  ON public.builder_pages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid()));
CREATE POLICY "Owners can write own builder pages"
  ON public.builder_pages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid())
  );
CREATE POLICY "Owners can update own builder pages"
  ON public.builder_pages FOR UPDATE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid())
  )
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid())
  );
CREATE POLICY "Owners can delete own builder pages"
  ON public.builder_pages FOR DELETE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces bs WHERE bs.id = builder_pages.surface_id AND bs.user_id = auth.uid())
  );

-- builder_sections: same split
DROP POLICY IF EXISTS "Owners can CRUD own builder sections" ON public.builder_sections;
CREATE POLICY "Owners can read own builder sections"
  ON public.builder_sections FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.builder_pages bp
    JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
    WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
  ));
CREATE POLICY "Owners can insert own builder sections"
  ON public.builder_sections FOR INSERT TO authenticated
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.builder_pages bp
      JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
      WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can update own builder sections"
  ON public.builder_sections FOR UPDATE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.builder_pages bp
      JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
      WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.builder_pages bp
      JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
      WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can delete own builder sections"
  ON public.builder_sections FOR DELETE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.builder_pages bp
      JOIN public.builder_surfaces bs ON bs.id = bp.surface_id
      WHERE bp.id = builder_sections.page_id AND bs.user_id = auth.uid()
    )
  );

-- builder_publishes: existing writes are already split (owner_insert/update/delete) and SELECT (anon) is untouched
DROP POLICY IF EXISTS owner_insert ON public.builder_publishes;
CREATE POLICY owner_insert ON public.builder_publishes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces s WHERE s.id = builder_publishes.surface_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS owner_update ON public.builder_publishes;
CREATE POLICY owner_update ON public.builder_publishes
  FOR UPDATE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces s WHERE s.id = builder_publishes.surface_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces s WHERE s.id = builder_publishes.surface_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS owner_delete ON public.builder_publishes;
CREATE POLICY owner_delete ON public.builder_publishes
  FOR DELETE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.builder_surfaces s WHERE s.id = builder_publishes.surface_id AND s.user_id = auth.uid())
  );

-- builder_media_assets
DROP POLICY IF EXISTS "Users can insert their own media assets" ON public.builder_media_assets;
CREATE POLICY "Users can insert their own media assets"
  ON public.builder_media_assets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_dashboard_allowed(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own media assets" ON public.builder_media_assets;
CREATE POLICY "Users can delete their own media assets"
  ON public.builder_media_assets FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.is_dashboard_allowed(auth.uid()));

-- surface_settings: split ALL into SELECT (unchanged) + write (gated)
DROP POLICY IF EXISTS "Owners can manage own surface settings" ON public.surface_settings;
CREATE POLICY "Owners can read own surface settings"
  ON public.surface_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.public_surfaces ps WHERE ps.id = surface_settings.surface_id AND public.is_owner(ps.user_id)));
CREATE POLICY "Owners can insert own surface settings"
  ON public.surface_settings FOR INSERT TO authenticated
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.public_surfaces ps WHERE ps.id = surface_settings.surface_id AND public.is_owner(ps.user_id))
  );
CREATE POLICY "Owners can update own surface settings"
  ON public.surface_settings FOR UPDATE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.public_surfaces ps WHERE ps.id = surface_settings.surface_id AND public.is_owner(ps.user_id))
  )
  WITH CHECK (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.public_surfaces ps WHERE ps.id = surface_settings.surface_id AND public.is_owner(ps.user_id))
  );
CREATE POLICY "Owners can delete own surface settings"
  ON public.surface_settings FOR DELETE TO authenticated
  USING (
    public.is_dashboard_allowed(auth.uid())
    AND EXISTS (SELECT 1 FROM public.public_surfaces ps WHERE ps.id = surface_settings.surface_id AND public.is_owner(ps.user_id))
  );

-- surface_commerce_config
DROP POLICY IF EXISTS "Owners can insert their commerce config" ON public.surface_commerce_config;
CREATE POLICY "Owners can insert their commerce config"
  ON public.surface_commerce_config FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.is_dashboard_allowed(auth.uid()));

DROP POLICY IF EXISTS "Owners can update their commerce config" ON public.surface_commerce_config;
CREATE POLICY "Owners can update their commerce config"
  ON public.surface_commerce_config FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND public.is_dashboard_allowed(auth.uid()))
  WITH CHECK (auth.uid() = owner_id AND public.is_dashboard_allowed(auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their commerce config" ON public.surface_commerce_config;
CREATE POLICY "Owners can delete their commerce config"
  ON public.surface_commerce_config FOR DELETE TO authenticated
  USING (auth.uid() = owner_id AND public.is_dashboard_allowed(auth.uid()));

-- 4. Extend handle_new_user trigger to enqueue signup notification email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_key text;
  v_url text := 'https://xcipuyvcwfytlsjryhvs.supabase.co/functions/v1/send-transactional-email';
BEGIN
  -- Existing behavior: create profile + default role
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- New: notify info@yangu.io of the signup via the existing transactional email pipeline
  BEGIN
    SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets
     WHERE name = 'email_queue_service_role_key'
     LIMIT 1;

    IF v_service_key IS NOT NULL AND NEW.email IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'templateName', 'new-signup-notification',
          'idempotencyKey', 'new-signup-' || NEW.id::text,
          'templateData', jsonb_build_object(
            'newUserEmail', NEW.email,
            'signupAt', to_char(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'userId', NEW.id::text
          )
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- never block signup on notification failure
    RAISE WARNING 'new-signup notification enqueue failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
