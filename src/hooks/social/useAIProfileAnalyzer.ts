import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnalyzedProfile {
  business_name: string;
  industry: string;
  business_description: string;
  target_audience: string;
  tone_of_voice: string;
  brand_voice: string;
  caption_rules: string[];
  preferred_ctas: string[];
  brand_keywords: string[];
  hashtag_rules: string;
  emoji_policy: string;
  language: string;
  positioning: string;
  website: string;
  visual_style: string;
}

export interface CaptionExample {
  caption: string;
  topic: string;
}

export function useAIProfileAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeUrl = useCallback(async (url: string): Promise<AnalyzedProfile | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-ai-profile-analyze", {
        body: { url },
      });
      if (error) throw error;
      if (!data?.profile) throw new Error("No profile returned");
      return data.profile as AnalyzedProfile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeUrl, isAnalyzing };
}

export function useAICaptionExamples() {
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<CaptionExample[]>([]);

  const generateExamples = useCallback(async (profile: Record<string, unknown>, count = 2) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-ai-caption-example", {
        body: { profile, count },
      });
      if (error) throw error;
      if (data?.examples) {
        setExamples(data.examples);
      }
    } catch (err) {
      toast.error("Failed to generate examples");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { examples, isLoading, generateExamples, setExamples };
}
