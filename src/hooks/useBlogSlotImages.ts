import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SlotImageMap = Record<string, string>;

export function useBlogSlotImages(sectionKey = "anthropic_research") {
  return useQuery({
    queryKey: ["blog-slot-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_section_images")
        .select("slot_key, image_url, updated_at")
        .eq("section_key", sectionKey);
      if (error) throw error;
      const map: SlotImageMap = {};
      (data || []).forEach((r) => {
        // Append cache-buster from updated_at so replaced images always show
        const ts = r.updated_at ? new Date(r.updated_at).getTime() : Date.now();
        map[r.slot_key] = `${r.image_url}?v=${ts}`;
      });
      return map;
    },
    staleTime: 30 * 1000,
  });
}
