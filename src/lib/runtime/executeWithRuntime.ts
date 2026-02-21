/**
 * Preflight Runtime Wrapper
 *
 * Single entry-point for any provider execution (image / video / text).
 * Validates runtime context, provider permission, scope, and rate limits
 * before invoking the actual work. Token lives only in-memory.
 */

import { resolveRuntimeExecution, recordUsage } from "./runtime-guard";
import type { RuntimeContext } from "./runtime-guard";
import { checkProviderPermission } from "./provider-gate";

export interface ExecuteWithRuntimeOpts<T> {
  surfaceId?: string;
  widgetKey?: string;
  providerKey?: string;
  requiredScope?: string;
  bucketKey?: string;
  /** The actual work to run if all checks pass. Receives the resolved context + token. */
  run: (ctx: RuntimeContext, token: string) => Promise<T>;
}

export interface RuntimeExecSuccess<T> {
  ok: true;
  result: T;
}

export interface RuntimeExecFailure {
  ok: false;
  reason: string;
}

export type RuntimeExecResult<T> = RuntimeExecSuccess<T> | RuntimeExecFailure;

/**
 * Execute a provider call only if runtime allows it.
 *
 * Deny-by-default: if surfaceId, widgetKey, or runtime context is missing
 * the call is blocked — no fallback execution.
 *
 * Dev-only bypass: set localStorage "yangu_runtime_bypass" = "1" in a
 * development build to skip the guard for local testing.
 */
export async function executeWithRuntime<T>(
  opts: ExecuteWithRuntimeOpts<T>
): Promise<RuntimeExecResult<T>> {
  const { surfaceId, widgetKey, providerKey, requiredScope, bucketKey, run } = opts;

  // ── Dev-only bypass (BOTH conditions required) ─────────────────────
  const devBypass =
    import.meta.env.DEV === true &&
    typeof window !== "undefined" &&
    window.localStorage?.getItem("yangu_runtime_bypass") === "1";

  // ── Missing context guard (deny by default) ───────────────────────
  if (!surfaceId || !widgetKey) {
    if (devBypass) {
      console.warn("[Runtime] DEV bypass active — skipping guard (missing context)");
      try {
        const result = await run({} as RuntimeContext, "dev_bypass_token");
        return { ok: true, result };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "execution_error";
        return { ok: false, reason: message };
      }
    }
    return { ok: false, reason: "missing_runtime_context" };
  }

  // ── 1. Resolve runtime execution ───────────────────────────────────
  const resolution = await resolveRuntimeExecution(surfaceId, widgetKey, {
    requiredProvider: providerKey,
    requiredScope,
  });

  if (!resolution.allowed) {
    const reason = (resolution as { allowed: false; reason: string }).reason;
    if (devBypass) {
      console.warn(`[Runtime] DEV bypass active — skipping denial: ${reason}`);
      try {
        const result = await run({} as RuntimeContext, "dev_bypass_token");
        return { ok: true, result };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "execution_error";
        return { ok: false, reason: message };
      }
    }
    return { ok: false, reason };
  }

  // ── 2. Extra provider permission gate (belt-and-suspenders) ────────
  if (providerKey) {
    const perm = checkProviderPermission(resolution.context, providerKey, requiredScope);
    if (!perm.allowed) {
      return { ok: false, reason: perm.reason ?? "provider_not_permitted" };
    }
  }

  // ── 3. Rate-limit pre-check + record usage ─────────────────────────
  if (bucketKey) {
    // recordUsage increments counter; the next resolveRuntimeExecution call
    // will catch over-limit via checkRateLimit inside the guard.
    recordUsage(bucketKey);
  }

  // ── 4. Run the actual work — token is in-memory only ───────────────
  try {
    const result = await run(resolution.context, resolution.token);
    return { ok: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "execution_error";
    return { ok: false, reason: message };
  }
}
