import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SurfaceMetric {
  surface: string;
  impressions: number;
  clicks: number;
}

interface EntityMetric {
  entity_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface TrustBandMetric {
  trust_band: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface TierMetric {
  visibility_tier: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface DailyTrend {
  day: string;
  impressions: number;
  clicks: number;
}

interface BannerMetric {
  surface: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface RotationFairness {
  total_entities_shown: number;
  paid_impression_share: number;
  top_overexposed: { entity_id: string; impressions: number }[];
}

export interface ExploreAnalyticsData {
  impressions_by_surface: SurfaceMetric[];
  top_entities: EntityMetric[];
  trust_band_performance: TrustBandMetric[];
  visibility_tier_performance: TierMetric[];
  daily_trend: DailyTrend[];
  rotation_fairness: RotationFairness;
  banner_performance: BannerMetric[];
}

/** @deprecated Use ExploreAnalyticsData */
export type DiscoveryAnalyticsData = ExploreAnalyticsData;

export function useExploreAnalytics(days = 30) {
  return useQuery({
    queryKey: ["manage", "explore-analytics", days],
    queryFn: async () => {
      // RPC name kept stable for migration compatibility
      const { data, error } = await supabase.rpc("discovery_analytics_summary", {
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as ExploreAnalyticsData;
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/** @deprecated Use useExploreAnalytics */
export const useDiscoveryAnalytics = useExploreAnalytics;
