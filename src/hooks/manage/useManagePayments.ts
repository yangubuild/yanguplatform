import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  user_id: string;
  provider: string;
  provider_sub_id: string | null;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  stripe_customer_id: string | null;
  paypal_payer_id: string | null;
}

interface PaymentStats {
  total: number;
  active: number;
  canceled: number;
  past_due: number;
  trialing: number;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  email: string | null;
  username: string | null;
}

interface PaymentsData {
  subscriptions: Subscription[];
  stats: PaymentStats;
  recent_transactions: Transaction[];
}

export function useManagePayments(status: string | null = null) {
  return useQuery({
    queryKey: ["manage", "payments", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_payments_overview", {
        p_status: status,
        p_limit: 200,
        p_offset: 0,
      });
      if (error) throw error;
      return data as unknown as PaymentsData;
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useSubscriptionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subscriptionId,
      action,
      reason,
    }: {
      subscriptionId: string;
      action: "cancel" | "reactivate" | "mark_past_due";
      reason?: string;
    }) => {
      const { error } = await supabase.rpc("manage_subscription_action", {
        p_subscription_id: subscriptionId,
        p_action: action,
        p_reason: reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "payments"] });
    },
  });
}

export type { Subscription, PaymentStats, Transaction, PaymentsData };
