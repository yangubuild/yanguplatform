DO $$
DECLARE
  fn_name text;
  sig text;
BEGIN
  FOR fn_name IN SELECT unnest(ARRAY[
    'admin_get_publish_attempt_logs',
    'admin_grant_credits_by_email',
    'admin_reset_user_onboarding',
    'admin_reset_user_quota',
    'admin_review_app',
    'admin_set_user_entitlements',
    'admin_update_quota_config'
  ])
  LOOP
    FOR sig IN
      SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid))
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fn_name
    LOOP
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', sig);
    END LOOP;
  END LOOP;
END $$;