/**
 * YANGU — Platform Variants Hook
 * React Query hooks for generating and querying platform-specific design variants.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialKeys } from "./queryKeys";
import {
  resizeEngine,
  type PlatformVariant,
} from "@/services/socialMedia/resizeEngine";
import type { TemplateLayer } from "@/types/templateDesign";
import { toast } from "sonner";

export function usePlatformVariants(designId: string | null) {
  const qc = useQueryClient();

  const variantsQuery = useQuery({
    queryKey: [...socialKeys.all, "platform-variants", designId],
    enabled: !!designId,
    queryFn: () => resizeEngine.getVariants(designId!),
  });

  const generateMutation = useMutation({
    mutationFn: (params: {
      designId: string;
      layers: TemplateLayer[];
      platforms?: string[];
    }) => resizeEngine.generateAllVariants(params.designId, params.layers, params.platforms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...socialKeys.all, "platform-variants"] });
      toast.success("Platform variants generated");
    },
  });

  return {
    variants: variantsQuery.data || [],
    isLoading: variantsQuery.isLoading,
    generateVariants: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
