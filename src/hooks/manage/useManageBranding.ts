import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ManagedBrandingSurface {
  id: string;
  title: string;
  slug: string;
  surface_type: string;
  theme: Json;
  created_at: string;
  updated_at: string;
}

export function useManageBranding() {
  return useQuery({
    queryKey: ["manage", "branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_surfaces")
        .select("id, title, slug, surface_type, theme, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ManagedBrandingSurface[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
