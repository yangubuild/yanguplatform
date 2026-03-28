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

      // Try to extract JSON from the response — it may be:
      // 1. Pure JSON string
      // 2. Markdown code block with JSON
      // 3. Text followed by JSON object
      // 4. Plain text with no JSON
      const extractJson = (raw: string): ParsedResponse => {
        // Try markdown code block first
        const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) {
          try {
            const parsed = JSON.parse(codeBlock[1].trim());
            return { text: parsed.text || "", buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [] };
          } catch { /* fall through */ }
        }

        // Try to find a JSON object anywhere in the string (first { to last })
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
            if (parsed.text) {
              return { text: parsed.text, buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [] };
            }
          } catch { /* fall through */ }
        }

        // Pure JSON
        try {
          const parsed = JSON.parse(raw);
          return { text: parsed.text || raw, buttons: Array.isArray(parsed.buttons) ? parsed.buttons : [] };
        } catch { /* fall through */ }

        // Plain text fallback
        return { text: raw, buttons: [] };
      };

      return extractJson(content);
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
