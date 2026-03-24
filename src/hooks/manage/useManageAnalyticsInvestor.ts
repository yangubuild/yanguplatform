import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InvestorAnalytics {
  revenue_total_cents: number;
  revenue_period_cents: number;
  active_users_period: number;
  total_users: number;
  new_users_period: number;
  kyc_total: number;
  kyc_approved: number;
  kyc_conversion_rate: number;
  subscriptions_active: number;
  subscriptions_total: number;
  subscription_conversion_rate: number;
  surfaces_total: number;
  surfaces_published: number;
  daily_revenue: { day: string; cents: number }[] | null;
  daily_signups: { day: string; count: number }[] | null;
}

export function useManageAnalyticsInvestor(days = 30) {
  return useQuery({
    queryKey: ["manage", "analytics-investor", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_analytics_investor", {
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as InvestorAnalytics;
    },
    staleTime: 60_000,
    retry: 1,
  });
}
