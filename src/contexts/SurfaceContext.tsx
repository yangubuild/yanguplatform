import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useAuth } from "@/hooks/useAuth";

interface SurfaceContextValue {
  /** The primary surface ID for the current user (first active surface). null if none or loading. */
  surfaceId: string | null;
  /** The org that owns the surface. null if unavailable. */
  orgId: string | null;
  /** True while the surfaces query is in-flight. */
  isLoading: boolean;
}

const SurfaceContext = createContext<SurfaceContextValue>({
  surfaceId: null,
  orgId: null,
  isLoading: true,
});

/**
 * Provides the canonical surfaceId derived from the user's first active surface.
 * Wrap any subtree that calls `executeWithRuntime` with this provider.
 */
export function SurfaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: surfaces, isLoading } = useSurfaces();

  const value = useMemo<SurfaceContextValue>(() => {
    if (!isAuthenticated || isLoading || !surfaces?.length) {
      return { surfaceId: null, orgId: null, isLoading };
    }
    // Pick first non-archived surface as canonical
    const primary = surfaces[0];
    return {
      surfaceId: primary.id,
      orgId: primary.org_id,
      isLoading: false,
    };
  }, [isAuthenticated, isLoading, surfaces]);

  return (
    <SurfaceContext.Provider value={value}>
      {children}
    </SurfaceContext.Provider>
  );
}

/**
 * Hook to access the canonical surface context.
 * Must be used within a `<SurfaceProvider>`.
 */
export function useSurfaceContext(): SurfaceContextValue {
  return useContext(SurfaceContext);
}
