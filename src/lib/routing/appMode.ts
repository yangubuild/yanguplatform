import { normalizeHostname } from "./resolveRoute";

/**
 * Enterprise domain mode resolver.
 * Maps a hostname to one of the platform application modes.
 */
export type AppMode = "platform" | "community" | "studio" | "live" | "publish_container" | "management" | "agency";

const HOST_MODE_MAP: Record<string, AppMode> = {
  "yangu.io": "platform",
  "yangu.community": "community",
  "yangu.studio": "studio",
  "manage.yangu.studio": "management",
  "yangu.live": "live",
  "yangu.shop": "publish_container",
  "yangu.store": "publish_container",
  "yangu.site": "publish_container",
  "agency.yangu.studio": "agency",
};

/**
 * Resolve the application mode from the current hostname.
 * Strips "www." prefix before lookup.
 * Returns null for dev/unknown hosts (caller should fall through to internal routing).
 */
export function resolveAppMode(host: string): AppMode | null {
  // Hard check BEFORE any normalization — prevents subdomain stripping
  if (host === "manage.yangu.studio" || host === "www.manage.yangu.studio") {
    console.log("APP MODE [raw]:", host, "→ management");
    return "management";
  }
  if (host === "agency.yangu.studio" || host === "www.agency.yangu.studio") {
    console.log("APP MODE [raw]:", host, "→ agency");
    return "agency";
  }

  const normalized = normalizeHostname(host);

  // Backup check post-normalization
  if (normalized === "manage.yangu.studio") {
    console.log("APP MODE:", host, "management");
    return "management";
  }

  const mode = HOST_MODE_MAP[normalized] ?? null;
  console.log("APP MODE:", host, mode);
  return mode;
}
