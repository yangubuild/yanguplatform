/**
 * React hooks for StudioAIEngine — used by all Studio tools.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  executeStudioJob,
  checkSubscriptionGate,
  type StudioRequest,
  type StudioResult,
  type StudioTool,
  type VideoGenerateResult,
  type ImageGenerateResult,
  type ScriptGenerateResult,
  type AvatarSpeakResult,
} from "@/lib/studio/StudioAIEngine";

export function useStudioJob<T extends StudioResult = StudioResult>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: StudioRequest): Promise<T> => {
      // 1. Subscription gate check
      const gate = await checkSubscriptionGate(request.tool);
      if (!gate.allowed) {
        throw new Error(gate.reason === "quota_reached" ? "QUOTA_REACHED" : "UPGRADE_REQUIRED");
      }

      // 2. Execute
      const result = await executeStudioJob(request);
      if (!result.ok) {
        throw new Error((result as any).error || "Generation failed");
      }

      return result as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      queryClient.invalidateQueries({ queryKey: ["studio-assets"] });
    },
    onError: (err: Error) => {
      if (err.message === "UPGRADE_REQUIRED") {
        // Don't toast — let the component show the upgrade modal
        return;
      }
      if (err.message === "QUOTA_REACHED") {
        toast.error("You've reached your usage limit. Please try again later or upgrade.");
        return;
      }
      toast.error(err.message || "Generation failed. Please try again.");
    },
  });
}

// Convenience typed hooks
export function useVideoGenerate() {
  return useStudioJob<VideoGenerateResult>();
}

export function useImageGenerate() {
  return useStudioJob<ImageGenerateResult>();
}

export function useScriptGenerate() {
  return useStudioJob<ScriptGenerateResult>();
}

export function useAvatarSpeak() {
  return useStudioJob<AvatarSpeakResult>();
}
