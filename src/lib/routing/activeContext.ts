/**
 * Manages the active routing context (developer vs platform).
 * Used by auth guards to prevent cross-redirects between portals.
 */

const KEY = "yangu_active_context";

export type ActiveContext = "developer" | "platform" | "management";

/** Read the stored context, or infer from the current path as a fail-safe. */
export function getActiveContext(pathname?: string): ActiveContext {
  const stored = sessionStorage.getItem(KEY) as ActiveContext | null;
  if (stored === "developer" || stored === "platform") return stored;

  // Fail-safe: infer from current path
  const path = pathname ?? window.location.pathname;
  const inferred: ActiveContext = path.startsWith("/developers") ? "developer" : "platform";
  sessionStorage.setItem(KEY, inferred);
  return inferred;
}

export function setActiveContext(ctx: ActiveContext) {
  sessionStorage.setItem(KEY, ctx);
}

export function clearActiveContext() {
  sessionStorage.removeItem(KEY);
}
