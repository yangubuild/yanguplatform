/**
 * YANGU Social Media — Multi-Post Variation Generation Hook
 * React Query mutations for generating 4+ variations, auto-scheduling, and managing the pipeline.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socialKeys } from "./queryKeys";
import {
  variationGenerationService,
  type VariationGenerationInput,
  type VariationGenerationResult,
} from "@/services/socialMedia/variationGenerationService";
import { toast } from "sonner";

export function useVariationGeneration() {
  const qc = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: (input: VariationGenerationInput) =>
      variationGenerationService.generateVariations(input),
    onSuccess: (result: VariationGenerationResult) => {
      // Invalidate all post and design queries
      qc.invalidateQueries({ queryKey: socialKeys.posts() });
      qc.invalidateQueries({ queryKey: socialKeys.all });
      toast.success(
        `Generated ${result.posts.length} posts — ${result.scheduled_count} auto-scheduled`
      );
    },
    onError: (err: Error) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const previewSchedule = (
    count: number,
    postsPerDay: number,
    startDate?: string
  ) => {
    return variationGenerationService.previewSchedule(count, postsPerDay, startDate);
  };

  return {
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    result: generateMutation.data || null,
    error: generateMutation.error,
    previewSchedule,
  };
}
