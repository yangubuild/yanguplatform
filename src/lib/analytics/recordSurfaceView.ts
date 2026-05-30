import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "yangu_view_session";
const SEEN_KEY_PREFIX = "yangu_view_seen:";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

/** Fire-and-forget view recorder. De-duplicates per (surface, path) within a session. */
export function recordSurfaceView(surfaceId: string, path: string) {
  if (!surfaceId) return;
  try {
    const key = `${SEEN_KEY_PREFIX}${surfaceId}:${path}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  const session_id = getSessionId();
  void supabase.from("surface_views").insert({
    surface_id: surfaceId,
    path: path || "/",
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    session_id,
  });
}

export function recordLinkClick(surfaceId: string, targetUrl: string, label?: string, path?: string) {
  if (!surfaceId || !targetUrl) return;
  void supabase.from("link_clicks").insert({
    surface_id: surfaceId,
    target_url: targetUrl,
    label: label ?? null,
    path: path ?? (typeof location !== "undefined" ? location.pathname : null),
    session_id: getSessionId(),
  });
}