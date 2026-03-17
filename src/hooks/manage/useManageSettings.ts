import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  updated_at: string;
}

export interface QuotaConfig {
  key: string;
  free_limit: number;
  starter_limit: number | null;
  creator_limit: number | null;
  reset_days: number;
  is_enabled: boolean;
  updated_at: string;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["manage", "feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as unknown as FeatureFlag[];
    },
    staleTime: 30_000,
  });
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase.rpc("manage_toggle_feature_flag", {
        p_key: key,
        p_enabled: enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manage", "feature-flags"] }),
  });
}

export function useQuotaConfigs() {
  return useQuery({
    queryKey: ["manage", "quota-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_quota_config")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as unknown as QuotaConfig[];
    },
    staleTime: 30_000,
  });
}

export function useUpdateQuotaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      key: string;
      free_limit?: number;
      starter_limit?: number;
      creator_limit?: number;
      is_enabled?: boolean;
    }) => {
      const { error } = await supabase.rpc("manage_update_quota_config", {
        p_key: params.key,
        p_free_limit: params.free_limit ?? null,
        p_starter_limit: params.starter_limit ?? null,
        p_creator_limit: params.creator_limit ?? null,
        p_is_enabled: params.is_enabled ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manage", "quota-configs"] }),
  });
}
