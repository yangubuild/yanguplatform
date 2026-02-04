import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { resolveRoute, isDevEnvironment, type ResolvedRoute, type RouteDebugInfo } from "@/lib/routing/resolveRoute";
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
 * Debug bar component - temporary for debugging route resolution
 */
function RouteDebugBar({ debug, route }: { debug: RouteDebugInfo | null; route: ResolvedRoute | null }) {
  if (!debug) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white text-xs p-2 z-[9999] font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
        <div>
          <span className="text-muted-foreground">rawHost:</span>{" "}
          <span className="text-green-400">{debug.rawHost}</span>
        </div>
        <div>
          <span className="text-muted-foreground">hostname:</span>{" "}
          <span className="text-green-400">{debug.hostname}</span>
        </div>
        <div>
          <span className="text-muted-foreground">canonicalHost:</span>{" "}
          <span className="text-yellow-400">{debug.canonicalHost}</span>
        </div>
        <div>
          <span className="text-muted-foreground">path:</span>{" "}
          <span className="text-blue-400">{debug.path}</span>
        </div>
        <div>
          <span className="text-muted-foreground">route_kind:</span>{" "}
          <span className="text-purple-400">{route?.route_kind ?? "null"}</span>
        </div>
        {route?.reason && (
          <div>
            <span className="text-muted-foreground">reason:</span>{" "}
            <span className="text-red-400">{route.reason}</span>
          </div>
        )}
        {route?.publish_id && (
          <div>
            <span className="text-muted-foreground">publish_id:</span>{" "}
            <span className="text-cyan-400">{route.publish_id}</span>
          </div>
        )}
        {route?.surface_id && (
          <div>
            <span className="text-muted-foreground">surface_id:</span>{" "}
            <span className="text-cyan-400">{route.surface_id}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resolves public domain routing based on host + path.
 * In dev environments or for internal routes, falls through to children.
 * On production platform domains, resolves via the database.
 */
export function PublicRouteResolver({ children }: PublicRouteResolverProps) {
  const location = useLocation();
  const [resolvedRoute, setResolvedRoute] = useState<ResolvedRoute | null>(null);
  const [debugInfo, setDebugInfo] = useState<RouteDebugInfo | null>(null);
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
        const { route, debug } = await resolveRoute();
        setResolvedRoute(route);
        setDebugInfo(debug);
        
        // If route_kind is not_found with unknown_host, fall through to internal routing
        if (route.route_kind === "not_found" && route.reason === "unknown_host") {
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

  // Content based on route_kind
  let content: ReactNode;
  
  switch (resolvedRoute.route_kind) {
    case "surface":
      content = (
        <SurfaceViewer
          surfaceId={resolvedRoute.surface_id!}
          publishId={resolvedRoute.publish_id}
          host={resolvedRoute.host}
          platformKey={resolvedRoute.platform_key}
        />
      );
      break;

    case "platform_home":
      content = (
        <DomainHome
          platformKey={resolvedRoute.platform_key}
          host={resolvedRoute.host}
        />
      );
      break;

    case "identity_profile":
      content = (
        <IdentityHub
          username={resolvedRoute.username!}
          host={resolvedRoute.host}
          platformKey={resolvedRoute.platform_key}
        />
      );
      break;

    case "not_found":
      content = <NotFound />;
      break;

    default:
      content = <>{children}</>;
  }

  return (
    <>
      {content}
      <RouteDebugBar debug={debugInfo} route={resolvedRoute} />
    </>
  );
}
