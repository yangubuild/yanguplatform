/**
 * React hook for free usage state (5 images / 2 videos promo).
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFreeUsageState, type FreeUsageState } from "@/lib/credits/freeUsage";

export function useFreeUsage() {
  const queryClient = useQueryClient();

  const query = useQuery<FreeUsageState>({
    queryKey: ["free-usage-state"],
    queryFn: getFreeUsageState,
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["free-usage-state"] });

  return {
    ...query,
    state: query.data ?? {
      claimed: false,
      imagesUsed: 0,
      imagesLeft: 0,
      videosUsed: 0,
      videosLeft: 0,
    },
    invalidate,
  };
}
