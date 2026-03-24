import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affected_system: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reporter_email: string | null;
  reporter_username: string | null;
  assignee_email: string | null;
  assignee_username: string | null;
}

export function useManageIncidents(status: string | null = null, severity: string | null = null) {
  return useQuery({
    queryKey: ["manage", "incidents", status, severity],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_incidents_list", {
        p_status: status,
        p_severity: severity,
      });
      if (error) throw error;
      return (data as unknown as Incident[]) ?? [];
    },
    staleTime: 10_000,
    retry: 1,
  });
}

export function useIncidentUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: string;
      title: string;
      description?: string;
      severity: string;
      status: string;
      affected_system?: string;
    }) => {
      const { data, error } = await supabase.rpc("manage_incident_upsert", {
        p_id: params.id ?? null,
        p_title: params.title,
        p_description: params.description ?? null,
        p_severity: params.severity,
        p_status: params.status,
        p_affected_system: params.affected_system ?? null,
      });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "incidents"] });
      qc.invalidateQueries({ queryKey: ["manage", "command-center"] });
    },
  });
}

export function useManageCommandCenter() {
  return useQuery({
    queryKey: ["manage", "command-center"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_command_center");
      if (error) throw error;
      return data as unknown as CommandCenterData;
    },
    staleTime: 10_000,
    refetchInterval: 15_000, // auto-refresh every 15s
    retry: 1,
  });
}

interface CommandCenterData {
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
  surfaces_published: number;
  red_alerts: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    affected_system: string | null;
    created_at: string;
  }>;
}

export type { Incident, CommandCenterData };
