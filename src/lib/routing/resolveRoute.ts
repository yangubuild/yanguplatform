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
  domain_type?: string;
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
 * - Lowercase
 * - Strip leading "www."
 */
export function normalizeHostname(hostname: string): string {
  let normalized = hostname.toLowerCase();
  if (normalized.startsWith("www.")) {
    normalized = normalized.slice(4);
  }
  return normalized;
}

/**
 * Normalize a path for route resolution:
 * - Ensure it starts with "/"
 */
export function normalizePath(path: string): string {
  if (!path || path === "") return "/";
  return path.startsWith("/") ? path : "/" + path;
}

/**
 * Debug info returned alongside the route resolution
 */
export interface RouteDebugInfo {
  rawHost: string;
  hostname: string;
  canonicalHost: string;
  path: string;
  resolverResponse: unknown;
  rpcError: string | null;
}

export async function resolveRoute(
  host?: string,
  path?: string
): Promise<{ route: ResolvedRoute; debug: RouteDebugInfo }> {
  // Capture raw values
  const rawHost = window.location.host;
  const hostname = host ?? window.location.hostname;
  const canonicalHost = normalizeHostname(hostname);
  const normalizedPath = normalizePath(path ?? window.location.pathname);

  const { data, error } = await supabase.rpc("resolve_route", {
    p_host: canonicalHost,
    p_path: normalizedPath,
  });

  // Format error for debug display
  let rpcErrorStr: string | null = null;
  if (error) {
    const parts: string[] = [];
    if (error.message) parts.push(`message: ${error.message}`);
    if (error.details) parts.push(`details: ${error.details}`);
    if (error.hint) parts.push(`hint: ${error.hint}`);
    if (error.code) parts.push(`code: ${error.code}`);
    rpcErrorStr = parts.length > 0 ? parts.join(" | ") : JSON.stringify(error);
  }

  const debug: RouteDebugInfo = {
    rawHost,
    hostname,
    canonicalHost,
    path: normalizedPath,
    resolverResponse: data,
    rpcError: rpcErrorStr,
  };

  if (error) {
    console.error("Route resolution error:", rpcErrorStr);
    return {
      route: {
        route_kind: "not_found",
        reason: rpcErrorStr || "RPC error",
      },
      debug,
    };
  }

  return {
    route: data as unknown as ResolvedRoute,
    debug,
  };
}

/**
 * Check if the current host is a known platform domain or dev environment
 */
export function isDevEnvironment(): boolean {
  const host = window.location.host;
  // Preview and local development patterns
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
