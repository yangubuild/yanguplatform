import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useVisionaireItems(category?: string | string[]) {
  return useQuery({
    queryKey: ["visionaire-items", category],
    queryFn: async () => {
      let q = supabase.from("visionaire_items").select("*").eq("is_active", true);
      if (category) {
        if (Array.isArray(category)) {
          q = q.in("category", category);
        } else {
          q = q.eq("category", category);
        }
      }
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useVisionaireSaves() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["visionaire-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_user_saves")
        .select("item_id, created_at, visionaire_items(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("visionaire_user_saves").insert({ user_id: user!.id, item_id: itemId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visionaire-saves"] });
    },
  });
}

export function useUnsaveItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("visionaire_user_saves").delete().eq("user_id", user!.id).eq("item_id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visionaire-saves"] });
    },
  });
}

export function useToolRuns(toolKey: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["visionaire-tool-runs", toolKey, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_tool_runs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("tool_key", toolKey)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveToolRun() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ toolKey, input, output }: { toolKey: string; input: Record<string, unknown>; output: string }) => {
      const { error } = await supabase.from("visionaire_tool_runs").insert({
        user_id: user!.id,
        tool_key: toolKey,
        input: input as any,
        output,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["visionaire-tool-runs", vars.toolKey] });
    },
  });
}
