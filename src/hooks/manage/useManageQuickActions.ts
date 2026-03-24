import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useQuickSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("manage_quick_suspend_user", { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("User suspended"); qc.invalidateQueries({ queryKey: ["manage"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useQuickRetryPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.rpc("manage_quick_retry_payment", { p_subscription_id: subscriptionId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Payment retry triggered"); qc.invalidateQueries({ queryKey: ["manage"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useQuickRetriggerKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("manage_quick_retrigger_kyc", { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("KYC re-triggered"); qc.invalidateQueries({ queryKey: ["manage"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
