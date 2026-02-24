import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrchestrationParams {
  productUrls: string[];
  studioProjectId?: string;
  provider?: "gemini" | "ideogram" | "qwen";
  count?: number;
  orientation?: "square" | "landscape" | "portrait";
}

export interface OrchestrationResult {
  success: boolean;
  project_id?: string;
  assets?: unknown[];
  total?: number;
  error?: string;
}

export function useImageAdsOrchestrate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);

  const orchestrate = async (params: OrchestrationParams): Promise<OrchestrationResult> => {
    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("image-ads-orchestrate", {
        body: {
          product_urls: params.productUrls,
          studio_project_id: params.studioProjectId,
          provider: params.provider || "gemini",
          count: params.count || 4,
          orientation: params.orientation || "portrait",
        },
      });

      if (error) {
        const errMsg = error.message || "Orchestration failed";
        toast.error(errMsg);
        const res = { success: false, error: errMsg };
        setResult(res);
        return res;
      }

      if (!data?.success) {
        const errMsg = data?.error || "Generation failed";
        toast.error(errMsg);
        const res = { success: false, error: errMsg };
        setResult(res);
        return res;
      }

      toast.success(`Generated ${data.total} ad variations!`);
      setResult(data);
      return data;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      toast.error(errMsg);
      const res = { success: false, error: errMsg };
      setResult(res);
      return res;
    } finally {
      setIsGenerating(false);
    }
  };

  return { orchestrate, isGenerating, result };
}
