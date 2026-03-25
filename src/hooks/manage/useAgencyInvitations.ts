import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AgencyInvitation {
  id: string;
  agency_id: string;
  email: string;
  role: string;
  commission_split_phase1: number;
  commission_split_phase2: number;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export function useAgencyInvitations(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "invitations", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_invitations" as any)
        .select("*")
        .eq("agency_id", agencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as AgencyInvitation[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      agency_id: string;
      email: string;
      role: string;
      commission_split_phase1: number;
      commission_split_phase2: number;
    }) => {
      const { data, error } = await supabase
        .from("agency_invitations" as any)
        .insert({
          ...payload,
          invited_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agency", "invitations", vars.agency_id] });
    },
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agency_id }: { id: string; agency_id: string }) => {
      const { error } = await supabase
        .from("agency_invitations" as any)
        .update({ status: "expired" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agency", "invitations", vars.agency_id] });
    },
  });
}
