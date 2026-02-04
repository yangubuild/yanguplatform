import { supabase } from "@/integrations/supabase/client";

/**
 * Route resolution result from the database
 */
export interface ResolvedRoute {
  route_kind: "surface" | "platform_home" | "identity_profile" | "not_found";
  publish_id?: string;
  surface_id?: string;
  domain_id?: string;
  host?: string;
  platform_key?: string;
  username?: string;
  slug?: string;
  reason?: string;
}

/**
 * Calls the resolve_route RPC to determine what content to show
 * based on the current host and path.
 */
/**
 * Normalize a hostname for route resolution:
 * - Use hostname (not host) to exclude port
 * - Lowercase
 * - Strip leading "www."
 */
function normalizeHostname(hostname: string): string {
  let normalized = hostname.toLowerCase();
  if (normalized.startsWith("www.")) {
    normalized = normalized.slice(4);
  }
  return normalized;
}

export async function resolveRoute(
  host?: string,
  path?: string
): Promise<ResolvedRoute> {
  // Use hostname (no port) and normalize it
  const rawHostname = host ?? window.location.hostname;
  const currentHost = normalizeHostname(rawHostname);
  const currentPath = path ?? window.location.pathname;

  const { data, error } = await supabase.rpc("resolve_route", {
    p_host: currentHost,
    p_path: currentPath,
  });

  if (error) {
    console.error("Route resolution error:", error);
    return {
      route_kind: "not_found",
      reason: error.message,
    };
  }

  return data as unknown as ResolvedRoute;
}

/**
 * Check if the current host is a known platform domain or dev environment
 */
export function isDevEnvironment(): boolean {
  const host = window.location.host;
  const devPatterns = [
    /localhost/,
    /127\.0\.0\.1/,
    /\.lovable\.app$/,
    /\.lovableproject\.com$/,
  ];
  return devPatterns.some((pattern) => pattern.test(host));
}

/**
 * Check if this is a known YANGU platform domain
 */
export function isPlatformDomain(host: string): boolean {
  const platformDomains = [
    "yangu.io",
    "yangu.shop",
    "yangu.store",
    "yangu.site",
    "yangu.studio",
    "yangu.live",
    "yangu.community",
  ];
  return platformDomains.includes(host);
}
