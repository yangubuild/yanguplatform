import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SlotImageMap = Record<string, string>;

export function useBlogSlotImages(sectionKey = "anthropic_research") {
  return useQuery({
    queryKey: ["blog-slot-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_section_images")
        .select("slot_key, image_url")
        .eq("section_key", sectionKey);
      if (error) throw error;
      const map: SlotImageMap = {};
      (data || []).forEach((r) => {
        map[r.slot_key] = r.image_url;
      });
      return map;
    },
    staleTime: 60 * 1000,
  });
}
