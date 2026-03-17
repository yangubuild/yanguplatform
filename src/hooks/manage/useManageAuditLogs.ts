import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_display_name: string | null;
}

interface AuditLogFilters {
  actions: string[];
  entity_types: string[];
}

interface UseAuditLogsParams {
  action?: string | null;
  entityType?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

export function useAuditLogsList({ action, entityType, search, limit = 50, offset = 0 }: UseAuditLogsParams = {}) {
  return useQuery({
    queryKey: ["manage", "audit-logs-list", action, entityType, search, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_audit_logs_list", {
        p_action: action ?? null,
        p_entity_type: entityType ?? null,
        p_search: search ?? null,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data as unknown as AuditLogRecord[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAuditLogFilters() {
  return useQuery({
    queryKey: ["manage", "audit-log-filters"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_audit_log_filters");
      if (error) throw error;
      return data as unknown as AuditLogFilters;
    },
    staleTime: 60_000,
    retry: 1,
  });
}
