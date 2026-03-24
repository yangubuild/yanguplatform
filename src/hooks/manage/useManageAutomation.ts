import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_enabled: boolean;
  created_by: string;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  status: string;
  result: Record<string, any>;
  error: string | null;
  executed_at: string;
}

export function useAutomationRules() {
  return useQuery({
    queryKey: ["manage", "automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_automation_rules_list");
      if (error) throw error;
      return (data as unknown as AutomationRule[]) ?? [];
    },
    staleTime: 15_000,
  });
}

export function useAutomationExecutions(ruleId: string | null) {
  return useQuery({
    queryKey: ["manage", "automation-executions", ruleId],
    queryFn: async () => {
      if (!ruleId) return [];
      const { data, error } = await supabase.rpc("manage_automation_executions", { p_rule_id: ruleId, p_limit: 20 });
      if (error) throw error;
      return (data as unknown as AutomationExecution[]) ?? [];
    },
    enabled: !!ruleId,
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; description: string; trigger_type: string; trigger_config: Record<string, any>; action_type: string; action_config: Record<string, any> }) => {
      const { data, error } = await supabase.rpc("manage_create_automation_rule", {
        p_name: params.name,
        p_description: params.description,
        p_trigger_type: params.trigger_type,
        p_trigger_config: params.trigger_config,
        p_action_type: params.action_type,
        p_action_config: params.action_config,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Rule created"); qc.invalidateQueries({ queryKey: ["manage", "automation-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      const { error } = await supabase.rpc("manage_toggle_automation_rule", { p_rule_id: ruleId, p_enabled: enabled });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rule updated"); qc.invalidateQueries({ queryKey: ["manage", "automation-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase.rpc("manage_delete_automation_rule", { p_rule_id: ruleId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rule deleted"); qc.invalidateQueries({ queryKey: ["manage", "automation-rules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
