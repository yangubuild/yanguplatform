import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import slot1 from "@/assets/anthropic-covers/slot1.png";
import slot2 from "@/assets/anthropic-covers/slot2.png";
import slot3 from "@/assets/anthropic-covers/slot3.png";
import slot4 from "@/assets/anthropic-covers/slot4.png";
import slot5 from "@/assets/anthropic-covers/slot5.png";
import slot6 from "@/assets/anthropic-covers/slot6.png";
import slot7 from "@/assets/anthropic-covers/slot7.png";

const LOCAL_SLOTS: Record<string, string> = {
  slot1, slot2, slot3, slot4, slot5, slot6, slot7,
};

export function useBlogSlotImages(sectionKey = "anthropic_research") {
  const { data: overrides } = useQuery({
    queryKey: ["blog-section-images", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_section_images")
        .select("slot_key, image_url")
        .eq("section_key", sectionKey);
      if (error) throw error;
      return data as { slot_key: string; image_url: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const overrideMap = new Map(
    (overrides || []).map((o) => [o.slot_key, o.image_url])
  );

  /** Returns the image URL for slot N (1-indexed) */
  const getSlotImage = (slotIndex: number): string => {
    const key = `slot${slotIndex}`;
    return overrideMap.get(key) || LOCAL_SLOTS[key] || "";
  };

  return { getSlotImage };
}
