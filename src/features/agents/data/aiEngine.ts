// Phase 7 — client bridge to the real retrieval + LLM engine.
// Calls the `agents-answer` edge function and returns a ConversationDecision-
// compatible object. Falls back to a safe local decision on error so the UI
// never breaks.

import { supabase } from "@/integrations/supabase/client";
import type { AgentConfig, ConversationDecision, Message } from "./types";

export interface AnswerInput {
  agentId: string;
  text: string;
  history?: Message[];
  agentConfig?: AgentConfig | null;
  testMode?: boolean;
  /** Optional recognised customer — enables persistent memory context server-side. */
  customerId?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  channel?: string;
}

export interface AnswerResult extends ConversationDecision {
  missingKnowledge?: boolean;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number | null;
  retrievalCount?: number;
}

export async function answerViaEngine(input: AnswerInput): Promise<AnswerResult> {
  const t0 = performance.now();
  try {
    const { data, error } = await supabase.functions.invoke("agents-answer", {
      body: {
        agentId: input.agentId,
        text: input.text,
        history: (input.history ?? []).map((m) => ({ role: m.role, text: m.text })),
        agentConfig: input.agentConfig ?? undefined,
        testMode: input.testMode ?? false,
        customerId: input.customerId,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        channel: input.channel,
      },
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("empty_response");
    return data as AnswerResult;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "engine_error";
    return {
      decision: "refuse",
      reply: input.agentConfig?.fallbackAnswer ||
        "I couldn't reach the AI service just now. Please try again in a moment.",
      language: input.agentConfig?.language || "English",
      confidence: 0,
      sources: [],
      latencyMs: Math.round(performance.now() - t0),
      tokensEstimate: 0,
      sentiment: "neutral",
      missingKnowledge: true,
      provider: "none",
      model: "none",
      retrievalCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      handover: { route: "support_queue", reason: msg },
    };
  }
}

/** Reindex a knowledge source (extract → chunk → embed → store). */
export async function reindexSource(sourceId: string): Promise<{ ok: boolean; chunks?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("agents-index-source", {
      body: { sourceId },
    });
    if (error) throw new Error(error.message);
    return { ok: true, chunks: (data as any)?.chunks };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "index_error" };
  }
}