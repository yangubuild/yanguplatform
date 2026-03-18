import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BANNER_DEFAULTS, type BannerSlot, type BannerData } from "@/lib/bannerContracts";

const QUERY_KEY = "landing_banners";

/**
 * Fetch editable banner data for landing page.
 * Falls back to BANNER_DEFAULTS when no DB row exists.
 */
export function useLandingBanners() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_banners" as any)
        .select("*")
        .in("slot", ["middle", "lower"]);

      if (error) {
        // Table may not exist yet — return defaults
        console.warn("landing_banners fetch failed, using defaults:", error.message);
        return {
          middle: BANNER_DEFAULTS.middle,
          lower: BANNER_DEFAULTS.lower,
        };
      }

      const rows = (data ?? []) as unknown as BannerData[];
      const map: Record<string, BannerData> = {};
      for (const row of rows) {
        map[row.slot] = row;
      }

      return {
        middle: map["middle"] ?? BANNER_DEFAULTS.middle,
        lower: map["lower"] ?? BANNER_DEFAULTS.lower,
      };
    },
    staleTime: 120_000,
  });
}

/**
 * Management panel mutations for editable banners.
 */
export function useBannerMutations() {
  const qc = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (banner: Partial<BannerData> & { slot: BannerSlot }) => {
      const { error } = await supabase
        .from("landing_banners" as any)
        .upsert(banner as any, { onConflict: "slot" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const remove = useMutation({
    mutationFn: async (slot: BannerSlot) => {
      const { error } = await supabase
        .from("landing_banners" as any)
        .update({ is_active: false } as any)
        .eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const restore = useMutation({
    mutationFn: async (slot: BannerSlot) => {
      const { error } = await supabase
        .from("landing_banners" as any)
        .update({ is_active: true } as any)
        .eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  return { upsert, remove, restore };
}
