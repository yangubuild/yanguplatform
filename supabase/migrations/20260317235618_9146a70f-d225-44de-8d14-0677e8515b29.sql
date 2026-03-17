-- Grant execute on search_entities to both anon (public landing) and authenticated
GRANT EXECUTE ON FUNCTION public.search_entities TO anon, authenticated;

-- Also grant execute on manage_overview_stats to anon for landing counters
GRANT EXECUTE ON FUNCTION public.manage_overview_stats TO anon, authenticated;