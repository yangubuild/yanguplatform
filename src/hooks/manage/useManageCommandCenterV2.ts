import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommandCenterV2Data {
  active_users_24h: number;
  active_users_7d: number;
  total_users: number;
  transactions_today: number;
  transactions_7d: number;
  revenue_today_cents: number;
  kyc_pending: number;
  kyc_approved_today: number;
  active_subscriptions: number;
  past_due_subscriptions: number;
  ai_generations_today: number;
  open_incidents: number;
  critical_incidents: number;
  support_pending: number;
  support_escalated: number;
  surfaces_published: number;
  surfaces_no_cover: number;
  red_alerts: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    affected_system: string | null;
    created_at: string;
    alert_type: string;
  }>;
  kyc_alerts: Array<{
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    alert_type: string;
  }>;
  payment_alerts: Array<{
    id: string;
    user_id: string;
    status: string;
    plan_id: string;
    created_at: string;
    alert_type: string;
  }>;
  error_spikes: {
    kyc_rejections_24h: number;
    failed_payments_24h: number;
    ai_errors_24h: number;
  };
}

export function useManageCommandCenterV2() {
  return useQuery({
    queryKey: ["manage", "command-center-v2"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_command_center_v2");
      if (error) throw error;
      return data as unknown as CommandCenterV2Data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });
}
