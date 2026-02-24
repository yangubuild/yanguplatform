import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdAnalysis {
  offer?: string;
  copy?: string;
  headline?: string;
  cta_text?: string;
  layout_summary?: string;
  colors?: string[];
  format?: string;
  style_notes?: string;
  brand_name?: string;
  raw?: string;
}

interface AdCloneResult {
  analysis: AdAnalysis;
  variations: Array<{ variation_index: number; file_url: string | null; metadata: Record<string, unknown> }>;
  saved_assets: unknown[];
}

export function useAdClone() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AdCloneResult | null>(null);

  const analyzeAd = async (adImageUrl: string, competitorUrl?: string, projectId?: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ad-clone-analyze", {
        body: {
          ad_image_url: adImageUrl,
          competitor_url: competitorUrl,
          studio_project_id: projectId,
        },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Ad analysis complete!");
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze ad");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeAd, isAnalyzing, result };
}
