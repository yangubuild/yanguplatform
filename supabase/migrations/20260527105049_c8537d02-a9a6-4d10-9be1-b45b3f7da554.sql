
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_users int;
  v_total_shops int;
  v_total_communities int;
BEGIN
  SELECT count(*)::int INTO v_total_users FROM public.profiles;
  SELECT count(*)::int INTO v_total_shops FROM public.surfaces WHERE archived_at IS NULL;
  SELECT count(*)::int INTO v_total_communities FROM public.community_listings;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'total_shops', v_total_shops,
    'total_communities', v_total_communities
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated, service_role;
