/**
 * Provider Execution Router
 *
 * Single runtime-aware interface for all provider executions (image, video, text).
 * Validates provider permission from the resolved runtime context, then dispatches
 * to the correct underlying implementation.
 *
 * No token logging. No persistence. No UI.
 */

import { checkProviderPermission } from "./provider-gate";
import type { RuntimeContext } from "./runtime-guard";
import { generateIdeogramImage } from "@/lib/ai/ideogram";
import { generateQwenImage } from "@/lib/ai/qwen";
import { generateGeminiImage } from "@/lib/ai/gemini";
import { generateCreatifyVideo } from "@/lib/ai/creatify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderAction = "image.generate" | "video.generate" | "text.generate";

export interface ProviderRouterOpts {
  /** Runtime context from executeWithRuntime / resolveRuntimeExecution */
  ctx: RuntimeContext;
  /** Runtime token (in-memory only) */
  token: string;
  /** e.g. "gemini" | "qwen" | "ideogram" | "creatify" | "openai" */
  providerKey: string;
  /** Stable action string */
  action: ProviderAction;
  /** Provider-specific request payload */
  payload: Record<string, unknown>;
}

export interface ProviderSuccess<T = unknown> {
  ok: true;
  data: T;
}

export interface ProviderFailure {
  ok: false;
  reason: string;
  detail?: string;
}

export type ProviderRouterResult<T = unknown> = ProviderSuccess<T> | ProviderFailure;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function runProviderAction<T = unknown>(
  opts: ProviderRouterOpts
): Promise<ProviderRouterResult<T>> {
  const { ctx, providerKey, action, payload } = opts;

  // 1. Defensive permission check (belt-and-suspenders with executeWithRuntime)
  const perm = checkProviderPermission(ctx, providerKey);
  if (!perm.allowed) {
    return { ok: false, reason: perm.reason ?? "provider_not_permitted" };
  }

  // 2. Dispatch to the correct implementation
  try {
    const result = await dispatch(providerKey, action, payload);
    return { ok: true, data: result as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "execution_error";
    return { ok: false, reason: "execution_error", detail: message };
  }
}

// ---------------------------------------------------------------------------
// Internal dispatch — maps (providerKey, action) → existing functions
// ---------------------------------------------------------------------------

async function dispatch(
  providerKey: string,
  action: ProviderAction,
  payload: Record<string, unknown>
): Promise<unknown> {
  const prompt = (payload.prompt as string) || "";

  // ── Image generation ──────────────────────────────────────────────
  if (action === "image.generate") {
    switch (providerKey) {
      case "ideogram":
        return generateIdeogramImage(prompt, payload.params as any);
      case "qwen":
        return generateQwenImage(prompt, payload.params as any);
      case "gemini":
        return generateGeminiImage(prompt, (payload.chatId as string) || "");
      default:
        throw new Error(`No image provider for key: ${providerKey}`);
    }
  }

  // ── Video generation ──────────────────────────────────────────────
  if (action === "video.generate") {
    switch (providerKey) {
      case "creatify":
        return generateCreatifyVideo(prompt, payload.params as any);
      default:
        throw new Error(`No video provider for key: ${providerKey}`);
    }
  }

  // ── Text generation (chat) — placeholder for future routing ───────
  if (action === "text.generate") {
    // Text/chat is currently handled via direct edge function calls (ada-chat).
    // The router acknowledges the action but the actual streaming is managed
    // by the calling component since SSE streaming doesn't fit the req/res model.
    throw new Error(`text.generate must be handled via streaming — use ada-chat edge function directly`);
  }

  throw new Error(`Unknown action: ${action}`);
}
