/**
 * Provider Permission Gate
 * 
 * Lightweight check before calling any AI / external provider.
 * Silently blocks execution if provider or scope is not permitted.
 */

import type { RuntimeContext } from "./runtime-guard";

export interface ProviderGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether a provider can be invoked given a resolved runtime context.
 *
 * @param ctx        — The runtime context returned by resolveRuntimeExecution
 * @param providerKey — e.g. "openai", "gemini", "qwen", "ideogram", "creatify"
 * @param requiredScope — optional scope key that must be approved
 */
export function checkProviderPermission(
  ctx: RuntimeContext,
  providerKey: string,
  requiredScope?: string
): ProviderGateResult {
  // Provider enabled?
  const provider = ctx.providers?.find((p) => p.provider_key === providerKey);
  if (!provider || !provider.is_active) {
    return { allowed: false, reason: "provider_not_enabled" };
  }

  // Scope granted?
  if (requiredScope) {
    const scope = ctx.scopes?.find(
      (s) => s.scope_key === requiredScope && s.status === "approved"
    );
    if (!scope) {
      return { allowed: false, reason: "scope_not_granted" };
    }
  }

  return { allowed: true };
}
