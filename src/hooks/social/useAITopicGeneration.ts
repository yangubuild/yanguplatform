import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedCategory {
  title: string;
  color: string;
  topics: { title: string; description: string }[];
}

export function useAITopicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTopics = useCallback(async (profile: Record<string, unknown>, url?: string): Promise<GeneratedCategory[] | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("social-ai-generate-topics", {
        body: { profile, url },
      });
      if (error) throw error;
      if (!data?.categories) throw new Error("No topics generated");
      return data.categories as GeneratedCategory[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Topic generation failed";
      toast.error(msg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateTopics, isGenerating };
}
