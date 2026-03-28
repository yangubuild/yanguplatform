import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ADA_SYSTEM_PROMPT } from "../utils/systemPrompt";
import type { ChatMessage, SelectionButton } from "../types/builder.types";

interface ParsedResponse {
  text: string;
  buttons: SelectionButton[];
}

export function useTogetherChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<ParsedResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array for Together API
      const messages = [
        { role: "system", content: ADA_SYSTEM_PROMPT },
        ...conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ];

      const { data, error: fnError } = await supabase.functions.invoke("together-chat", {
        body: {
          messages,
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          temperature: 0.7,
          max_tokens: 800,
        },
      });

      if (fnError) throw new Error(fnError.message || "Failed to get response");
      if (!data?.success) throw new Error(data?.error || "AI request failed");

      const content = data.content as string;

      // Try to parse JSON response
      try {
        // Extract JSON from potential markdown code blocks
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();
        
        const parsed = JSON.parse(jsonStr);
        return {
          text: parsed.text || content,
          buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [],
        };
      } catch {
        // If not valid JSON, return as plain text
        return { text: content, buttons: [] };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      return { text: "Sorry, I had trouble responding. Please try again.", buttons: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
