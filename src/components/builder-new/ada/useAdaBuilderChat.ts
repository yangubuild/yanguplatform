/**
 * Shared ADA builder chat hook — single runtime for left panel + Magic Editor popup.
 * Wired to real mutation flow via builder-ai-service.ts.
 * Falls back to local deterministic parsing when AI gateway returns 402/429.
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
import {
  parseLocalIntent,
  buildLocalReply,
  extractPageContext,
} from "@/lib/builder/ada-local-fallback";

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

      // Build context snapshot
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

      // Try the AI gateway first
      let plan: (AdaMutationPlan & { reply?: string }) | null = null;
      let usedFallback = false;

      try {
        const { data, error } = await supabase.functions.invoke("ada-builder-edit", {
          body: {
            userMessage: userText,
            contextSummary,
            conversationHistory: history.slice(0, -1),
          },
        });

        if (error || !data?.ok) {
          const errorCode = data?.error || (error as Record<string, unknown>)?.error;
          // If 402/429 → use local fallback
          if (errorCode === "rate_limited" || errorCode === "payment_required") {
            usedFallback = true;
          } else {
            addAssistantMessage("Something went wrong. Please try again.");
            return;
          }
        } else {
          plan = data.plan;
        }
      } catch {
        // Network error → try fallback
        usedFallback = true;
      }

      // ── Local fallback path ──
      if (usedFallback) {
        if (!currentHtml || !binding) {
          addAssistantMessage("I can see your request but I don't have access to the page right now. Try refreshing the editor.");
          return;
        }

        const pageCtx = extractPageContext(currentHtml);
        const localPlan = parseLocalIntent(userText, pageCtx);

        if (!localPlan) {
          addAssistantMessage("I couldn't understand that request clearly enough to make a safe edit. Try being more specific, for example: change BBQ Wings price to $20, or add Jollof Rice at $15.");
          return;
        }

        plan = { ...localPlan, reply: buildLocalReply(localPlan) };
      }

      if (!plan) {
        addAssistantMessage("Something went wrong. Please try again.");
        return;
      }

      const reply = stripAdaFormatting(plan.reply || "");

      // If AI asks for clarification or says unsupported
      if (plan.action === "ask_clarification") {
        addAssistantMessage(stripAdaFormatting(plan.clarification || reply || "Which item or section should I change?"));
        return;
      }

      if (plan.action === "unsupported") {
        addAssistantMessage(stripAdaFormatting(plan.reason || reply || "I can't handle that request from here yet."));
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
          binding.setHtml(mutation.nextHtml);

          // Verify the mutation took effect
          await new Promise((r) => setTimeout(r, 100));
          const afterHtml = binding.getHtml();
          if (afterHtml && mutation.verify(afterHtml)) {
            addAssistantMessage(mutation.successMessage);
          } else {
            addAssistantMessage(mutation.successMessage + " (Please check the preview to confirm.)");
          }
          break;
        }

        case "sections":
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
