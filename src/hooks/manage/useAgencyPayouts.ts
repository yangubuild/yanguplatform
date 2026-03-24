import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PayoutRequest {
  id: string;
  agency_id: string;
  member_user_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  requested_at: string;
  approved_at: string | null;
  disbursed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

export interface PayoutData {
  requests: PayoutRequest[];
  payable_cents: number;
  disbursed_cents: number;
  pending_request_cents: number;
}

export function useAgencyPayouts(agencyId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ["agency", "payouts", agencyId, userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_payouts", {
        p_agency_id: agencyId!,
        ...(userId ? { p_user_id: userId } : {}),
      });
      if (error) throw error;
      return data as unknown as PayoutData;
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}

export function useRequestPayout(agencyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amountCents: number) => {
      const { data, error } = await supabase.rpc("request_payout", {
        p_agency_id: agencyId!,
        p_amount_cents: amountCents,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", "payouts", agencyId] });
      qc.invalidateQueries({ queryKey: ["agency", "commissions", agencyId] });
      toast.success("Payout request submitted");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}
