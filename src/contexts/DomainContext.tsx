import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDomainRouteConfig, isRouteAllowedForDomain, DEFAULT_DOMAIN_TYPE, type DomainRouteConfig } from "@/config/domain-routes";
import type { Database } from "@/integrations/supabase/types";

type DomainType = Database["public"]["Enums"]["surface_type"] | "io";

// Domain lookup result from database
interface DomainRecord {
  id: string;
  host: string;
  domain_type: string;
  org_id: string;
  is_active: boolean;
}

// Context state shape
interface DomainContextState {
  /** Unique domain ID from database */
  domainId: string | null;
  /** Type of domain (io, shop, studio, etc.) */
  domainType: DomainType;
  /** Organization that owns this domain */
  orgId: string | null;
  /** Whether the domain is active */
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

// Known YANGU domains and their types
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

export function DomainProvider({ children }: DomainProviderProps) {
  const [state, setState] = useState<Omit<DomainContextState, "routeConfig">>({
    domainId: null,
    domainType: DEFAULT_DOMAIN_TYPE,
    orgId: null,
    isActive: true,
    host: typeof window !== "undefined" ? window.location.host : "",
    isLoading: true,
    error: null,
    isFallback: false,
  });

  useEffect(() => {
    async function resolveDomain() {
      const host = window.location.host;
      
      // Check if it's a development/preview environment
      const isDev = DEV_PATTERNS.some((pattern) => pattern.test(host));
      
      if (isDev) {
        // In development, default to identity hub (io)
        setState((prev) => ({
          ...prev,
          host,
          domainType: "io",
          isActive: true,
          isLoading: false,
          isFallback: true,
        }));
        return;
      }

      // Check known YANGU domains first (static resolution)
      const knownType = KNOWN_DOMAINS[host];
      if (knownType) {
        // Still look up in DB to get domain_id and org_id
        try {
          const { data, error } = await supabase
            .from("domains")
            .select("id, host, domain_type, owner_org_id, is_active")
            .eq("host", host)
            .eq("is_active", true)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setState({
              domainId: data.id,
              domainType: data.domain_type as DomainType,
              orgId: data.owner_org_id,
              isActive: data.is_active ?? true,
              host,
              isLoading: false,
              error: null,
              isFallback: false,
            });
          } else {
            // Known domain but not in DB - use static config
            setState({
              domainId: null,
              domainType: knownType,
              orgId: null,
              isActive: true,
              host,
              isLoading: false,
              error: null,
              isFallback: true,
            });
          }
        } catch (err) {
          console.error("Domain resolution error:", err);
          setState({
            domainId: null,
            domainType: knownType,
            orgId: null,
            isActive: true,
            host,
            isLoading: false,
            error: err instanceof Error ? err.message : "Domain resolution failed",
            isFallback: true,
          });
        }
        return;
      }

      // Custom domain - look up in database
      try {
        const { data, error } = await supabase
          .from("domains")
          .select("id, host, domain_type, owner_org_id, is_active")
          .eq("host", host)
          .maybeSingle();

        if (error) throw error;

        if (data && data.is_active) {
          setState({
            domainId: data.id,
            domainType: data.domain_type as DomainType,
            orgId: data.owner_org_id,
            isActive: data.is_active ?? true,
            host,
            isLoading: false,
            error: null,
            isFallback: false,
          });
        } else {
          // Domain not found or inactive - fallback to identity hub
          setState({
            domainId: null,
            domainType: DEFAULT_DOMAIN_TYPE,
            orgId: null,
            isActive: false,
            host,
            isLoading: false,
            error: data ? "Domain is inactive" : "Domain not found",
            isFallback: true,
          });
        }
      } catch (err) {
        console.error("Domain resolution error:", err);
        setState({
          domainId: null,
          domainType: DEFAULT_DOMAIN_TYPE,
          orgId: null,
          isActive: true,
          host,
          isLoading: false,
          error: err instanceof Error ? err.message : "Domain resolution failed",
          isFallback: true,
        });
      }
    }

    resolveDomain();
  }, []);

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
