import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PromoCampaign {
  id: string;
  key: string;
  title: string;
  message: string;
  reward_type: string;
  reward_payload: Record<string, unknown>;
  trigger_type: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
}

export function useActivePromos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-promos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_active_promos" as any);
      if (error) throw error;
      return (data || []) as PromoCampaign[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
