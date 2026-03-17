import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TimePoint {
  day: string;
  count: number;
}

interface AnalyticsTotals {
  total_users: number;
  users_7d: number;
  users_30d: number;
  total_surfaces: number;
  active_domains: number;
  active_subscriptions: number;
  open_alerts: number;
  builder_events_7d: number;
  active_app_installs: number;
}

export interface AnalyticsData {
  totals: AnalyticsTotals;
  user_growth: TimePoint[];
  surface_growth: TimePoint[];
  domain_growth: TimePoint[];
  audit_activity: TimePoint[];
  builder_events: TimePoint[];
}

export function useManageAnalytics(days = 30) {
  return useQuery({
    queryKey: ["manage", "analytics", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_analytics_overview", {
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as AnalyticsData;
    },
    staleTime: 60_000,
    retry: 1,
  });
}
