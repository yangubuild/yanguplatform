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
import { beginSession, speak as voiceSpeak, stopSpeaking } from "@/lib/voice/voiceController";

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
      let events: Array<Record<string, unknown>> | null = null;
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
          events = Array.isArray(data.events) ? data.events : null;
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
        // Synthesize an event envelope for the fallback path so dispatch is uniform.
        events = [
          { type: "ui_update", message: "Working on it…" },
          { type: "edit_site", action: localPlan.action, target: localPlan.target ?? null, changes: localPlan.changes ?? null, plan },
          { type: "tts", text: plan.reply || "" },
        ];
      }

      if (!plan) {
        addAssistantMessage("Something went wrong. Please try again.");
        return;
      }

      // ── Event-driven dispatcher ──
      // Reusable mutation runner — guarded so the plan can only execute once per turn.
      let mutationRan = false;
      let mutationSpoke = false;

      const runMutationOnce = async (
        mutationPlan: AdaMutationPlan & { reply?: string }
      ): Promise<{ message: string; ok: boolean } | null> => {
        if (mutationRan) return null;
        mutationRan = true;

        const replyText = stripAdaFormatting(mutationPlan.reply || "");

        if (mutationPlan.action === "ask_clarification") {
          const msg = stripAdaFormatting(
            mutationPlan.clarification || replyText || "Which item or section should I change?"
          );
          addAssistantMessage(msg);
          return { message: msg, ok: false };
        }

        if (mutationPlan.action === "unsupported") {
          const msg = stripAdaFormatting(
            mutationPlan.reason || replyText || "I can't handle that request from here yet."
          );
          addAssistantMessage(msg);
          return { message: msg, ok: false };
        }

        if (!currentHtml || !binding) {
          const msg =
            replyText ||
            "I can see your request, but I don't have access to the page content right now. Try refreshing the editor.";
          addAssistantMessage(msg);
          return { message: msg, ok: false };
        }

        const mutation = prepareAdaMutation(snapshot, mutationPlan);

        switch (mutation.kind) {
          case "clarify":
            addAssistantMessage(mutation.message);
            return { message: mutation.message, ok: false };

          case "failed":
            addAssistantMessage(mutation.message);
            return { message: mutation.message, ok: false };

          case "html": {
            binding.setHtml(mutation.nextHtml);
            await new Promise((r) => setTimeout(r, 100));
            const afterHtml = binding.getHtml();
            const ok = !!(afterHtml && mutation.verify(afterHtml));
            const msg = ok
              ? mutation.successMessage
              : mutation.successMessage + " (Please check the preview to confirm.)";
            addAssistantMessage(msg);
            return { message: msg, ok };
          }

          case "sections": {
            const msg =
              replyText ||
              "I prepared the change but this surface uses HTML editing. The update should be visible now.";
            addAssistantMessage(msg);
            return { message: msg, ok: true };
          }
        }
        return null;
      };

      // ── Event stream path ──
      if (events && events.length) {
        // Clarification short-circuits everything else in the stream.
        const clarify = events.find((e) => e?.type === "clarification");
        if (clarify) {
          addAssistantMessage(
            stripAdaFormatting(String(clarify.message || "Could you be more specific?"))
          );
          return;
        }

        for (const ev of events) {
          try {
            const type = String(ev?.type || "");
            switch (type) {
              case "ui_update": {
                const message = typeof ev.message === "string" ? ev.message.trim() : "";
                // Skip generic "Working on it…" filler so chat isn't noisy.
                if (message && !/^working on it/i.test(message)) {
                  addAssistantMessage(stripAdaFormatting(message));
                }
                break;
              }

              case "edit_site":
              case "mutation": {
                const evPlan = (ev.plan || ev.data || plan) as
                  | (AdaMutationPlan & { reply?: string })
                  | null;
                if (!evPlan) break;
                const result = await runMutationOnce(evPlan);
                if (result?.ok) {
                  // Mutation produced its own confirmation — that becomes the voice.
                  speakSafe(result.message);
                  mutationSpoke = true;
                }
                break;
              }

              case "tts": {
                // Only one confirmation voice per action.
                if (mutationSpoke) break;
                const text = typeof ev.text === "string" ? ev.text.trim() : "";
                if (text) {
                  speakSafe(stripAdaFormatting(text));
                  mutationSpoke = true;
                }
                break;
              }

              default:
                break;
            }
          } catch (err) {
            console.error("ADA event failed:", ev?.type, err);
          }
        }

        // If the stream had no edit_site/mutation event but a plan exists, run it as fallback.
        if (!mutationRan) {
          const result = await runMutationOnce(plan);
          if (result?.ok && !mutationSpoke) {
            speakSafe(result.message);
            mutationSpoke = true;
          }
        }
      } else {
        // ── Legacy plan-only path (no events array) ──
        const result = await runMutationOnce(plan);
        if (result?.ok) speakSafe(result.message);
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

    function speakSafe(text: string) {
      try {
        if (typeof window === "undefined") return;
        const synth = window.speechSynthesis;
        if (!synth || !text) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1;
        utter.pitch = 1;
        synth.speak(utter);
      } catch {
        // TTS is best-effort; never block dispatch.
      }
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat, bindEditor };
}
