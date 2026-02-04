import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { getDomainRouteConfig, isRouteAllowedForDomain, DEFAULT_DOMAIN_TYPE, type DomainRouteConfig } from "@/config/domain-routes";
import type { Database } from "@/integrations/supabase/types";
import { normalizeHostname } from "@/lib/routing/resolveRoute";

type DomainType = Database["public"]["Enums"]["surface_type"] | "io";

// Context state shape
interface DomainContextState {
  /** Type of domain (io, shop, studio, etc.) */
  domainType: DomainType;
  /** Whether the domain is active (always true for known domains) */
  isActive: boolean;
  /** Current host being resolved */
  host: string;
  /** Whether domain resolution is in progress */
  isLoading: boolean;
  /** Error during resolution */
  error: string | null;
  /** Route configuration for current domain */
  routeConfig: DomainRouteConfig;
  /** Whether this is the fallback/default domain */
  isFallback: boolean;
}

// Known YANGU platform domains and their types
// This is static resolution - no database lookup needed
const KNOWN_DOMAINS: Record<string, DomainType> = {
  "yangu.io": "io",
  "yangu.shop": "shop",
  "yangu.store": "store",
  "yangu.site": "site",
  "yangu.studio": "studio",
  "yangu.live": "live",
  "yangu.community": "community",
};

// Development/preview domain patterns
const DEV_PATTERNS = [
  /localhost/,
  /127\.0\.0\.1/,
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
];

const DomainContext = createContext<DomainContextState | null>(null);

interface DomainProviderProps {
  children: ReactNode;
}

/**
 * Resolve domain type statically from hostname.
 * No database lookups - actual route resolution happens via RPC in PublicRouteResolver.
 */
function resolveDomainType(host: string): { domainType: DomainType; isFallback: boolean } {
  // Normalize host (strip www, lowercase)
  const normalizedHost = normalizeHostname(host);
  
  // Check if it's a development/preview environment
  const isDev = DEV_PATTERNS.some((pattern) => pattern.test(host));
  if (isDev) {
    return { domainType: "io", isFallback: true };
  }

  // Check known YANGU domains (static resolution)
  const knownType = KNOWN_DOMAINS[normalizedHost];
  if (knownType) {
    return { domainType: knownType, isFallback: false };
  }

  // Unknown domain - could be custom domain, default to io
  // Actual routing will be handled by PublicRouteResolver via RPC
  return { domainType: "io", isFallback: true };
}

export function DomainProvider({ children }: DomainProviderProps) {
  // Resolve domain type synchronously on mount - no async needed
  const host = typeof window !== "undefined" ? window.location.host : "";
  const { domainType, isFallback } = resolveDomainType(host);
  
  const [state] = useState<Omit<DomainContextState, "routeConfig">>({
    domainType,
    isActive: true,
    host,
    isLoading: false,
    error: null,
    isFallback,
  });

  // Compute route config based on domain type
  const contextValue = useMemo<DomainContextState>(() => ({
    ...state,
    routeConfig: getDomainRouteConfig(state.domainType),
  }), [state]);

  return (
    <DomainContext.Provider value={contextValue}>
      {children}
    </DomainContext.Provider>
  );
}

// Hook to access domain context
export function useDomain(): DomainContextState {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error("useDomain must be used within a DomainProvider");
  }
  return context;
}

// Hook to check if current domain allows a specific route
export function useDomainRoute(route: string): boolean {
  const { domainType } = useDomain();
  
  // Use the centralized route checking logic that handles public slugs
  return isRouteAllowedForDomain(route, domainType);
}

export { DomainContext };
export type { DomainContextState, DomainType };
