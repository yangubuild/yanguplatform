import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { resolveRoute, isDevEnvironment, normalizeHostname, type ResolvedRoute, type RouteDebugInfo } from "@/lib/routing/resolveRoute";
import { resolveAppMode } from "@/lib/routing/appMode";
import { DomainHome } from "./DomainHome";
import Index from "@/pages/Index";
import Community from "@/pages/Community";
import { StudioLanding } from "./StudioLanding";
import { LiveLanding } from "./LiveLanding";
import { PublishContainerLanding } from "./PublishContainerLanding";
import { IdentityHub } from "./IdentityHub";
import { SurfaceViewer } from "./SurfaceViewer";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

interface PublicRouteResolverProps {
  children: ReactNode;
}

// Removed REDIRECT_DOMAINS — root path behavior is now handled by resolveAppMode()

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
  "/why-yangu",
  "/discover",
  "/discover-yangu",
  "/blog",
  "/ada-ai",
];

/**
 * Debug bar component - temporary for debugging route resolution
 */
function RouteDebugBar({ debug, route }: { debug: RouteDebugInfo | null; route: ResolvedRoute | null }) {
  // Belt-and-suspenders: never render in production even if caller forgets the gate
  if (!import.meta.env.DEV) return null;
  if (!debug) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white text-xs p-2 z-[9999] font-mono overflow-x-auto">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
        <div>
          <span className="text-muted-foreground">rawHost:</span>{" "}
          <span className="text-green-400">{debug.rawHost}</span>
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
        {debug.rpcError && (
          <div className="w-full">
            <span className="text-muted-foreground">rpcError:</span>{" "}
            <span className="text-red-400 break-all">{debug.rpcError}</span>
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
  const [appModeResult, setAppModeResult] = useState<ReturnType<typeof resolveAppMode>>(null);

  useEffect(() => {
    async function resolve() {
      const path = location.pathname;

      // Community routes must always fall through to React Router on ALL hosts
      if (path.startsWith("/community")) {
        setShouldUseInternalRouting(true);
        setIsLoading(false);
        return;
      }
      
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

      // Enterprise domain mode switch for root path
      const appMode = resolveAppMode(window.location.hostname);
      if (appMode && appMode !== "platform") {
        // On community domain, allow /community/* paths to fall through to React Router
        if (appMode === "community" && path.startsWith("/community")) {
          setShouldUseInternalRouting(true);
          setIsLoading(false);
          return;
        }
        // Root path on non-platform domains renders mode-specific landing
        if (path === "/") {
          setAppModeResult(appMode);
          setIsLoading(false);
          return;
        }
      }

      // Resolve via database for production platform domains
      try {
        const { route, debug } = await resolveRoute();
        
        // Debug logging — dev only
        if (import.meta.env.DEV) {
          console.log("[PUBLIC ROUTE RESOLVED]", {
            canonicalHost: debug.canonicalHost,
            path: debug.path,
            result: route,
          });
        }
        
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

  // Use internal React Router routing ONLY for:
  // 1. Dev environment
  // 2. Internal routes (/auth, /dashboard, etc.)
  // 3. Unknown hosts (localhost, preview domains)
  if (shouldUseInternalRouting) {
    return <>{children}</>;
  }

  // Enterprise domain mode: render root landing based on appMode
  if (appModeResult) {
    const modeContent: Record<string, ReactNode> = {
      community: <Community />,
      studio: <StudioLanding />,
      live: <LiveLanding />,
      publish_container: <PublishContainerLanding />,
    };
    return (
      <>
        {modeContent[appModeResult] ?? <NotFound />}
        {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={null} />}
      </>
    );
  }

  // *** CRITICAL: From here on, we are on a PRODUCTION PLATFORM DOMAIN ***
  // We must NEVER fall through to React Router for public paths.
  // The RPC response fully determines what to render.

  // If somehow resolvedRoute is null (shouldn't happen), show NotFound instead of falling through
  if (!resolvedRoute) {
    console.error("[PublicRouteResolver] No route resolved on production domain, showing NotFound");
    return (
      <>
        <NotFound />
        {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={null} />}
      </>
    );
  }

  // Content based on route_kind - NO default fallthrough to React Router
  let content: ReactNode;
  
  switch (resolvedRoute.route_kind) {
    case "surface":
      if (!resolvedRoute.publish_id) {
        content = <NotFound />;
      } else {
        content = (
          <SurfaceViewer
            publishId={resolvedRoute.publish_id}
            host={resolvedRoute.host}
            domainType={resolvedRoute.domain_type}
          />
        );
      }
      break;

    case "platform_home":
      // For the primary domain (io), show the public landing page
      if (resolvedRoute.domain_type === "io") {
        content = <Index />;
      } else if (resolvedRoute.domain_type === "community") {
        // yangu.community root → show Community homepage
        content = <Community />;
      } else {
        content = (
          <DomainHome
            domainType={resolvedRoute.domain_type}
            host={resolvedRoute.host}
          />
        );
      }
      break;

    case "identity_profile":
      content = (
        <IdentityHub
          username={resolvedRoute.username!}
          host={resolvedRoute.host}
          domainType={resolvedRoute.domain_type}
        />
      );
      break;

    case "not_found":
    default:
      // CRITICAL: Treat any unknown route_kind as not_found
      // Never fall through to React Router on production platform domains
      content = <NotFound />;
      break;
  }

  return (
    <>
      {content}
      {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={resolvedRoute} />}
    </>
  );
}
