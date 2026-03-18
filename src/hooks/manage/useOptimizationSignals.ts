import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExposureTuningSignal, BannerOptimizationSignal } from "@/lib/adaptiveTuning";

/**
 * Hook to view current exposure tuning signals (management panel).
 */
export function useExposureTuningSignals() {
  return useQuery({
    queryKey: ["manage", "exposure-tuning-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exposure_tuning_signals")
        .select("*")
        .order("overexposure_score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ExposureTuningSignal[];
    },
    staleTime: 60_000,
  });
}

/**
 * Hook to view banner optimization signals.
 */
export function useBannerOptimizationSignals() {
  return useQuery({
    queryKey: ["manage", "banner-optimization-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banner_optimization_signals")
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as BannerOptimizationSignal[];
    },
    staleTime: 60_000,
  });
}

/**
 * Mutation to trigger refresh of exposure tuning signals.
 */
export function useRefreshTuningSignals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_exposure_tuning_signals" as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "exposure-tuning-signals"] });
    },
  });
}

/**
 * Mutation to trigger refresh of banner optimization signals.
 */
export function useRefreshBannerSignals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_banner_optimization_signals" as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "banner-optimization-signals"] });
    },
  });
}
