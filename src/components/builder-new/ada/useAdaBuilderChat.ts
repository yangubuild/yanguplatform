/**
 * Shared ADA builder chat hook — single runtime for left panel + Magic Editor popup.
 * Uses Together AI edge function for real assistant responses.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const ADA_BUILDER_SYSTEM_PROMPT = `You are Ada, the AI builder assistant for YANGU surfaces.

You help users edit and manage their website/menu/store directly from the builder.

## What you can help with:
- Add, edit, or remove menu items / products with prices
- Update business info: name, WhatsApp number, contact details, address
- Change colors: background, text, buttons, sections
- Edit text content on any section
- Configure commerce: delivery mode, payment methods, WhatsApp ordering
- Suggest layout improvements
- Add or reorder sections

## Response rules:
- Be concise and actionable
- When the user asks to change something, confirm what you'll change and describe the action clearly
- Use markdown for clarity
- If you cannot perform an action directly, explain what the user should do in the editor
- Never restart onboarding flows — the site already exists
- Stay grounded to the current page state

## Format:
Respond with helpful, direct text. No JSON wrapping needed. Use markdown formatting.`;

export function useAdaBuilderChat() {
  const [messages, setMessages] = useState<AdaChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userText: string) => {
    const userMsg: AdaChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMsg].slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("together-chat", {
        body: {
          messages: [
            { role: "system", content: ADA_BUILDER_SYSTEM_PROMPT },
            ...historyForApi,
          ],
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          temperature: 0.6,
          max_tokens: 600,
        },
      });

      let responseText = "Sorry, I had trouble responding. Please try again.";
      if (!error && data?.success && data?.content) {
        // Strip any JSON wrapper if model returns one
        let raw = data.content as string;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.text) raw = parsed.text;
        } catch { /* plain text is fine */ }
        responseText = raw;
      }

      const assistantMsg: AdaChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AdaChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}
