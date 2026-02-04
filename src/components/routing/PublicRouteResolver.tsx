import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { resolveRoute, isDevEnvironment, type ResolvedRoute } from "@/lib/routing/resolveRoute";
import { DomainHome } from "./DomainHome";
import { IdentityHub } from "./IdentityHub";
import { SurfaceViewer } from "./SurfaceViewer";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

interface PublicRouteResolverProps {
  children: ReactNode;
}

// Routes that should always use internal React Router handling
const INTERNAL_ROUTES = [
  "/auth/",
  "/dashboard",
  "/onboarding",
  "/kyc",
  "/billing",
  "/studio",
  "/surfaces/",
  "/s/",
  "/dev/",
];

/**
 * Resolves public domain routing based on host + path.
 * In dev environments or for internal routes, falls through to children.
 * On production platform domains, resolves via the database.
 */
export function PublicRouteResolver({ children }: PublicRouteResolverProps) {
  const location = useLocation();
  const [resolvedRoute, setResolvedRoute] = useState<ResolvedRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldUseInternalRouting, setShouldUseInternalRouting] = useState(false);

  useEffect(() => {
    async function resolve() {
      const path = location.pathname;
      
      // Check if this is an internal route that should use React Router
      const isInternalRoute = INTERNAL_ROUTES.some((route) => path.startsWith(route));
      
      // In dev environment, only resolve for specific public patterns
      const isDev = isDevEnvironment();
      
      // For dev environment or internal routes, use internal routing
      if (isDev || isInternalRoute) {
        setShouldUseInternalRouting(true);
        setIsLoading(false);
        return;
      }

      // Resolve via database for production platform domains
      try {
        const result = await resolveRoute();
        setResolvedRoute(result);
        
        // If route_kind is not_found with unknown_host, fall through to internal routing
        if (result.route_kind === "not_found" && result.reason === "unknown_host") {
          setShouldUseInternalRouting(true);
        }
      } catch (err) {
        console.error("Route resolution failed:", err);
        setShouldUseInternalRouting(true);
      } finally {
        setIsLoading(false);
      }
    }

    resolve();
  }, [location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Use internal React Router routing
  if (shouldUseInternalRouting) {
    return <>{children}</>;
  }

  // Render based on resolved route
  if (!resolvedRoute) {
    return <>{children}</>;
  }

  switch (resolvedRoute.route_kind) {
    case "surface":
      return (
        <SurfaceViewer
          surfaceId={resolvedRoute.surface_id!}
          publishId={resolvedRoute.publish_id}
          host={resolvedRoute.host}
          platformKey={resolvedRoute.platform_key}
        />
      );

    case "platform_home":
      return (
        <DomainHome
          platformKey={resolvedRoute.platform_key}
          host={resolvedRoute.host}
        />
      );

    case "identity_profile":
      return (
        <IdentityHub
          username={resolvedRoute.username!}
          host={resolvedRoute.host}
          platformKey={resolvedRoute.platform_key}
        />
      );

    case "not_found":
      return <NotFound />;

    default:
      return <>{children}</>;
  }
}
