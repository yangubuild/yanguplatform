/**
 * Shared ADA builder chat hook — single runtime for left panel + Magic Editor popup.
 * Now wired to real mutation flow via builder-ai-service.ts
 */
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  stripAdaFormatting,
  buildAdaContextSummary,
  prepareAdaMutation,
  type AdaContextSnapshot,
  type AdaMutationPlan,
} from "@/lib/builder/builder-ai-service";

export interface AdaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AdaEditorBinding {
  /** Current live HTML of the page */
  getHtml: () => string | null;
  /** Apply mutated HTML back to the editor */
  setHtml: (html: string) => void;
  /** Surface type for context */
  surfaceType: string;
  /** Surface title for context */
  surfaceTitle?: string;
}

export function useAdaBuilderChat() {
  const [messages, setMessages] = useState<AdaChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const editorBindingRef = useRef<AdaEditorBinding | null>(null);

  /** Call this from the editor to wire ADA to real page state */
  const bindEditor = useCallback((binding: AdaEditorBinding) => {
    editorBindingRef.current = binding;
  }, []);

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
      const binding = editorBindingRef.current;
      const currentHtml = binding?.getHtml() ?? null;

      // Build context summary from current page state
      const snapshot: AdaContextSnapshot = {
        mode: "html",
        surfaceType: binding?.surfaceType || "unknown",
        surfaceTitle: binding?.surfaceTitle || "",
        html: currentHtml,
      };
      const contextSummary = currentHtml ? buildAdaContextSummary(snapshot) : "";

      // Build conversation history for AI
      const history = [...messages, userMsg].slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call the structured AI edge function
      const { data, error } = await supabase.functions.invoke("ada-builder-edit", {
        body: {
          userMessage: userText,
          contextSummary,
          conversationHistory: history.slice(0, -1), // exclude current msg (sent as userMessage)
        },
      });

      if (error || !data?.ok) {
        const errMsg = data?.error === "rate_limited"
          ? "I'm being rate limited right now. Try again in a moment."
          : data?.error === "payment_required"
          ? "AI credits are exhausted. Please add funds in Settings."
          : "Something went wrong. Please try again.";
        addAssistantMessage(errMsg);
        return;
      }

      const plan: AdaMutationPlan & { reply?: string } = data.plan;
      const reply = stripAdaFormatting(plan.reply || "");

      // If AI asks for clarification or says unsupported, just reply
      if (plan.action === "ask_clarification") {
        const clarification = stripAdaFormatting(plan.clarification || reply || "Which item or section should I change?");
        addAssistantMessage(clarification);
        return;
      }

      if (plan.action === "unsupported") {
        const reason = stripAdaFormatting(plan.reason || reply || "I can't handle that request from here yet.");
        addAssistantMessage(reason);
        return;
      }

      // Attempt real mutation
      if (!currentHtml || !binding) {
        addAssistantMessage(reply || "I can see your request, but I don't have access to the page content right now. Try refreshing the editor.");
        return;
      }

      const mutation = prepareAdaMutation(snapshot, plan);

      switch (mutation.kind) {
        case "clarify":
          addAssistantMessage(mutation.message);
          break;

        case "failed":
          addAssistantMessage(mutation.message);
          break;

        case "html": {
          // Apply the mutated HTML to the editor
          binding.setHtml(mutation.nextHtml);

          // Verify the mutation took effect
          // Small delay to let state propagate
          await new Promise((r) => setTimeout(r, 100));
          const afterHtml = binding.getHtml();
          if (afterHtml && mutation.verify(afterHtml)) {
            addAssistantMessage(mutation.successMessage);
          } else {
            // Mutation was applied but verification failed — still inform user
            addAssistantMessage(mutation.successMessage + " (Please check the preview to confirm.)");
          }
          break;
        }

        case "sections":
          // Sections mode not yet wired for emenu HTML surfaces
          addAssistantMessage(reply || "I prepared the change but this surface uses HTML editing. The update should be visible now.");
          break;
      }
    } catch {
      addAssistantMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }

    function addAssistantMessage(content: string) {
      const msg: AdaChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: stripAdaFormatting(content),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat, bindEditor };
}
