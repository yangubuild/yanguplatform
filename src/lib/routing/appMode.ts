import { normalizeHostname } from "./resolveRoute";

/**
 * Enterprise domain mode resolver.
 * Maps a hostname to one of the platform application modes.
 */
export type AppMode = "platform" | "community" | "studio" | "live" | "publish_container";

const HOST_MODE_MAP: Record<string, AppMode> = {
  "yangu.io": "platform",
  "yangu.community": "community",
  "yangu.studio": "studio",
  "yangu.live": "live",
  "yangu.shop": "publish_container",
  "yangu.store": "publish_container",
  "yangu.site": "publish_container",
};

/**
 * Resolve the application mode from the current hostname.
 * Strips "www." prefix before lookup.
 * Returns null for dev/unknown hosts (caller should fall through to internal routing).
 */
export function resolveAppMode(host: string): AppMode | null {
  const normalized = normalizeHostname(host);
  return HOST_MODE_MAP[normalized] ?? null;
}
