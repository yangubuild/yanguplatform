import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KycItem {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  metadata: any;
  created_at: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface KycStats {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  rejected: number;
}

interface KycData {
  items: KycItem[];
  stats: KycStats;
}

export function useManageKyc(status: string | null = null) {
  return useQuery({
    queryKey: ["manage", "kyc", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_kyc_list", {
        p_status: status,
        p_limit: 200,
        p_offset: 0,
      });
      if (error) throw error;
      return data as unknown as KycData;
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useKycUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      verificationId,
      newStatus,
      reason,
    }: {
      verificationId: string;
      newStatus: string;
      reason?: string;
    }) => {
      const { error } = await supabase.rpc("manage_kyc_update_status", {
        p_verification_id: verificationId,
        p_new_status: newStatus,
        p_reason: reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "kyc"] });
    },
  });
}

export type { KycItem, KycStats, KycData };
