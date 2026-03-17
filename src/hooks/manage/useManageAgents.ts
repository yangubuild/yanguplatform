import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedAgent {
  id: string;
  name: string;
  description: string | null;
  model: string | null;
  status: string;
  surface_id: string | null;
  created_at: string;
  updated_at: string;
  onboarding_steps: number;
}

export function useManageAgents() {
  return useQuery({
    queryKey: ["manage", "agents"],
    queryFn: async () => {
      const { data: agents, error } = await supabase
        .from("agents")
        .select("id, name, description, model, status, surface_id, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get onboarding step counts
      const { data: onboardings } = await supabase
        .from("agent_onboardings")
        .select("agent_id");

      const stepCounts: Record<string, number> = {};
      (onboardings ?? []).forEach((o) => {
        stepCounts[o.agent_id] = (stepCounts[o.agent_id] ?? 0) + 1;
      });

      return (agents ?? []).map((a) => ({
        ...a,
        onboarding_steps: stepCounts[a.id] ?? 0,
      })) as ManagedAgent[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
