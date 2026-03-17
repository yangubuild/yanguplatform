import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ManagedPage {
  id: string;
  title: string;
  slug: string;
  surface_id: string;
  surface_title: string | null;
  section_count: number;
  created_at: string;
  updated_at: string;
}

export function useManagePages() {
  return useQuery({
    queryKey: ["manage", "pages"],
    queryFn: async () => {
      const { data: pages, error } = await supabase
        .from("builder_pages")
        .select("id, title, slug, surface_id, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Surface titles
      const surfaceIds = [...new Set((pages ?? []).map((p) => p.surface_id))];
      const { data: surfaces } = surfaceIds.length
        ? await supabase
            .from("builder_surfaces")
            .select("id, title")
            .in("id", surfaceIds)
        : { data: [] };

      const surfaceMap: Record<string, string> = {};
      (surfaces ?? []).forEach((s) => { surfaceMap[s.id] = s.title; });

      // Section counts
      const { data: sections } = await supabase
        .from("builder_sections")
        .select("page_id");

      const sectionCounts: Record<string, number> = {};
      (sections ?? []).forEach((s) => {
        sectionCounts[s.page_id] = (sectionCounts[s.page_id] ?? 0) + 1;
      });

      return (pages ?? []).map((p) => ({
        ...p,
        surface_title: surfaceMap[p.surface_id] ?? null,
        section_count: sectionCounts[p.id] ?? 0,
      })) as ManagedPage[];
    },
    staleTime: 30_000,
    retry: 1,
  });
}
