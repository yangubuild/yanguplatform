import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SurfaceAnalyticsData {
  totals: { views: number; visitors: number; clicks: number; days: number };
  daily: Array<{ day: string; views: number; visitors: number }>;
  referrers: Array<{ referrer: string; n: number }>;
  paths: Array<{ path: string; n: number }>;
  top_clicks: Array<{ target_url: string; label: string; n: number }>;
}

export function useSurfaceAnalytics(surfaceId: string | null | undefined, days = 30) {
  return useQuery({
    queryKey: ["surface_analytics", surfaceId, days],
    enabled: !!surfaceId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("surface_analytics_overview", {
        p_surface_id: surfaceId!,
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as SurfaceAnalyticsData;
    },
    staleTime: 60_000,
  });
}

export interface PublishHistoryRow {
  id: string;
  version: number | null;
  state: string | null;
  published_at: string | null;
  unpublished_at: string | null;
}

export function useSurfacePublishHistory(surfaceId: string | null | undefined) {
  return useQuery({
    queryKey: ["surface_publish_history", surfaceId],
    enabled: !!surfaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_publishes")
        .select("id, version, state, published_at, unpublished_at")
        .eq("surface_id", surfaceId!)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PublishHistoryRow[];
    },
    staleTime: 60_000,
  });
}