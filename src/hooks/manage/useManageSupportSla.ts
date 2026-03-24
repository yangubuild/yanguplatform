import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupportTicketSla {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  hours_since_created: number;
  sla_breached: boolean;
}

export function useManageSupportSla(status: string | null = null) {
  return useQuery({
    queryKey: ["manage", "support-sla", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_support_sla_list", {
        p_status: status,
      });
      if (error) throw error;
      return (data as unknown as SupportTicketSla[]) ?? [];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });
}
