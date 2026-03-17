import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedIntegration {
  id: string;
  name: string;
  slug: string;
  category: string;
  provider_name: string;
  status: string;
  app_type: string;
  is_native_yangu: boolean;
  is_featured: boolean;
  install_count: number;
}

export function useManageIntegrations() {
  return useQuery({
    queryKey: ["manage", "integrations"],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from("app_registry")
        .select("id, name, slug, category, provider_name, status, app_type, is_native_yangu, is_featured")
        .order("sort_order", { ascending: true });
      if (error) throw error;

      // Get install counts
      const { data: installs } = await supabase
        .from("app_user_installs")
        .select("app_id");

      const installCounts: Record<string, number> = {};
      (installs ?? []).forEach((i) => {
        installCounts[i.app_id] = (installCounts[i.app_id] ?? 0) + 1;
      });

      return (apps ?? []).map((a) => ({
        ...a,
        install_count: installCounts[a.id] ?? 0,
      })) as ManagedIntegration[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
