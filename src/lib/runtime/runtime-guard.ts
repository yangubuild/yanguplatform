/**
 * Runtime Execution Guard
 * 
 * Validates runtime context before any widget/provider execution.
 * Returns structured denial — never throws.
 */

import { supabase } from "@/integrations/supabase/client";

export interface RuntimeDenial {
  allowed: false;
  reason: string;
}

export interface RuntimeGrant {
  allowed: true;
  context: RuntimeContext;
  token: string;
}

export type RuntimeResult = RuntimeDenial | RuntimeGrant;

interface RuntimeWidget {
  widget_key: string;
  is_enabled: boolean;
  [key: string]: unknown;
}

interface RuntimeProvider {
  provider_key: string;
  is_active: boolean;
  [key: string]: unknown;
}

interface RuntimeScope {
  scope_key: string;
  status: string;
  [key: string]: unknown;
}

interface RuntimeRateLimit {
  bucket_key: string;
  max_requests: number;
  window_seconds: number;
  [key: string]: unknown;
}

export interface RuntimeContext {
  app_id: string;
  widgets: RuntimeWidget[];
  providers: RuntimeProvider[];
  scopes: RuntimeScope[];
  rate_limits: RuntimeRateLimit[];
}

// ---------------------------------------------------------------------------
// In-memory rate-limit tracking (per session, no persistence)
// ---------------------------------------------------------------------------
const usageCounters: Record<string, { count: number; windowStart: number }> = {};

function checkRateLimit(limits: RuntimeRateLimit[]): RuntimeDenial | null {
  const now = Date.now();
  for (const limit of limits) {
    const key = limit.bucket_key;
    const entry = usageCounters[key];
    if (entry) {
      const windowMs = limit.window_seconds * 1000;
      if (now - entry.windowStart < windowMs) {
        if (entry.count >= limit.max_requests) {
          return { allowed: false, reason: "rate_limited" };
        }
      } else {
        // window expired — reset
        usageCounters[key] = { count: 0, windowStart: now };
      }
    }
  }
  return null;
}

/** Increment counter after a successful execution */
export function recordUsage(bucketKey: string) {
  const now = Date.now();
  const entry = usageCounters[bucketKey];
  if (entry) {
    entry.count += 1;
  } else {
    usageCounters[bucketKey] = { count: 1, windowStart: now };
  }
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve whether a widget execution is permitted.
 *
 * 1. Fetches runtime context via RPC
 * 2. Validates widget existence & enabled state
 * 3. Validates surface install exists
 * 4. Validates provider permissions (if widget requires a provider)
 * 5. Validates rate limits (soft preflight)
 * 6. Mints a short-lived token (in-memory only)
 */
export async function resolveRuntimeExecution(
  surfaceId: string,
  widgetKey: string,
  options?: { requiredProvider?: string; requiredScope?: string }
): Promise<RuntimeResult> {
  // 1. Fetch runtime context
  const { data: raw, error: ctxErr } = await supabase.rpc("get_app_runtime_context", {
    p_app_id: surfaceId,
  });

  if (ctxErr || !raw) {
    return { allowed: false, reason: "runtime_not_permitted" };
  }

  const ctx = raw as unknown as RuntimeContext;

  // 2. Widget exists and is enabled
  const widget = ctx.widgets?.find((w) => w.widget_key === widgetKey);
  if (!widget) {
    return { allowed: false, reason: "runtime_not_permitted" };
  }
  if (!widget.is_enabled) {
    return { allowed: false, reason: "runtime_not_permitted" };
  }

  // 3. Surface install with this widget_key exists
  const { data: installRows, error: installErr } = await supabase
    .from("developer_surface_installs")
    .select("id, install_id")
    .eq("surface_id", surfaceId)
    .eq("widget_key", widgetKey)
    .in("status", ["active", "enabled"])
    .limit(1);

  if (installErr || !installRows || installRows.length === 0) {
    return { allowed: false, reason: "widget_not_installed" };
  }

  const surfaceInstall = installRows[0];

  // 4. Provider permission gate
  if (options?.requiredProvider) {
    const provider = ctx.providers?.find(
      (p) => p.provider_key === options.requiredProvider
    );
    if (!provider || !provider.is_active) {
      return { allowed: false, reason: "provider_not_permitted" };
    }
  }

  if (options?.requiredScope) {
    const scope = ctx.scopes?.find(
      (s) => s.scope_key === options.requiredScope && s.status === "approved"
    );
    if (!scope) {
      return { allowed: false, reason: "runtime_not_permitted" };
    }
  }

  // 5. Rate limit soft guard
  if (ctx.rate_limits && ctx.rate_limits.length > 0) {
    const denial = checkRateLimit(ctx.rate_limits);
    if (denial) return denial;
  }

  // 6. Mint execution token (in-memory only — never persisted or logged)
  const { data: token, error: tokenErr } = await supabase.rpc(
    "create_widget_install_token",
    { p_surface_install_id: surfaceInstall.id }
  );

  if (tokenErr || !token) {
    return { allowed: false, reason: "runtime_not_permitted" };
  }

  return {
    allowed: true,
    context: ctx,
    token: token as string,
  };
}
