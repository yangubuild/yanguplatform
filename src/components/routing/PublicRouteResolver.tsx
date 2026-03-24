import { lazyRetry } from "@/lib/lazyRetry";
import { useEffect, useState, ReactNode, lazy, Suspense, useRef } from "react";
import { useLocation } from "react-router-dom";
import { resolveRoute, isDevEnvironment, normalizeHostname, type ResolvedRoute, type RouteDebugInfo } from "@/lib/routing/resolveRoute";
import { resolveAppMode } from "@/lib/routing/appMode";
import { ManagementRoutes } from "@/components/manage/ManagementRoutes";

const DomainHome = lazy(() => lazyRetry(() => import("./DomainHome").then((m) => ({ default: m.DomainHome }))));
const Index = lazy(() => lazyRetry(() => import("@/pages/Index")));
const Community = lazy(() => lazyRetry(() => import("@/pages/Community")));
const StudioLanding = lazy(() => lazyRetry(() => import("./StudioLanding").then((m) => ({ default: m.StudioLanding }))));
const LiveLanding = lazy(() => lazyRetry(() => import("./LiveLanding").then((m) => ({ default: m.LiveLanding }))));
const PublishContainerLanding = lazy(() => lazyRetry(() => import("./PublishContainerLanding").then((m) => ({ default: m.PublishContainerLanding }))));
const IdentityHub = lazy(() => lazyRetry(() => import("./IdentityHub").then((m) => ({ default: m.IdentityHub }))));
const SurfaceViewer = lazy(() => lazyRetry(() => import("./SurfaceViewer").then((m) => ({ default: m.SurfaceViewer }))));
const NotFound = lazy(() => lazyRetry(() => import("@/pages/NotFound")));

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
  "/why-yangu",
  "/discover",
  "/discover-yangu",
  "/blog",
  "/ada-ai",
  "/ada",
  "/privacy",
  "/terms",
  
  "/builder",
];

const resolverFallback = <div className="bg-background min-h-screen"  />;

// Session-level cache for route resolution to eliminate blank frames on revisit
const routeCache = new Map<string, { route: ResolvedRoute; debug: RouteDebugInfo }>();

/**
 * Debug bar component - temporary for debugging route resolution
 */
function RouteDebugBar({ debug, route }: { debug: RouteDebugInfo | null; route: ResolvedRoute | null }) {
  // Belt-and-suspenders: never render in production even if caller forgets the gate
  if (!import.meta.env.DEV) return null;
  if (!debug) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-foreground text-xs p-2 z-[9999] font-mono overflow-x-auto">
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
  const [shouldUseInternalRouting, setShouldUseInternalRouting] = useState(false);
  const [appModeResult, setAppModeResult] = useState<ReturnType<typeof resolveAppMode>>(null);

  // Detect management subdomain synchronously
  const isManagementHost = useRef(resolveAppMode(window.location.hostname) === "management").current;

  // Compute synchronous fast-path: determine if we can skip loading entirely
  const fastPathRef = useRef<boolean | null>(null);
  if (fastPathRef.current === null) {
    const path = location.pathname;
    const isDev = isDevEnvironment();
    const isInternal = INTERNAL_ROUTES.some((route) => path.startsWith(route));
    const isCommunity = path.startsWith("/community");
    if (isDev || isInternal || isCommunity || isManagementHost) {
      fastPathRef.current = true;
    } else {
      fastPathRef.current = false;
    }
  }

  // If fast-path determined we're internal, start with isLoading=false
  const [isLoading, setIsLoading] = useState(!fastPathRef.current);

  useEffect(() => {
    // Once internal routing is determined, never re-resolve
    if (shouldUseInternalRouting) return;

    // Management subdomain always uses ManagementRoutes — skip all resolution
    if (isManagementHost) return;

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
        if (appMode === "community" && path.startsWith("/community")) {
          setShouldUseInternalRouting(true);
          setIsLoading(false);
          return;
        }
        if (path === "/") {
          setAppModeResult(appMode);
          setIsLoading(false);
          return;
        }
      }

      // Check in-memory cache first to eliminate blank frame on revisit
      const cacheKey = `${normalizeHostname(window.location.hostname)}::${path}`;
      const cached = routeCache.get(cacheKey);
      if (cached) {
        setResolvedRoute(cached.route);
        setDebugInfo(cached.debug);
        if (cached.route.route_kind === "not_found" && cached.route.reason === "unknown_host") {
          setShouldUseInternalRouting(true);
        }
        setIsLoading(false);
        // Still refresh in background (stale-while-revalidate)
        resolveRoute().then(({ route, debug }) => {
          routeCache.set(cacheKey, { route, debug });
          setResolvedRoute(route);
          setDebugInfo(debug);
        }).catch(() => {});
        return;
      }

      // Resolve via database for production platform domains
      try {
        const { route, debug } = await resolveRoute();
        
        // Cache result
        routeCache.set(cacheKey, { route, debug });

        if (import.meta.env.DEV) {
          console.log("[PUBLIC ROUTE RESOLVED]", {
            canonicalHost: debug.canonicalHost,
            path: debug.path,
            result: route,
          });
        }
        
        setResolvedRoute(route);
        setDebugInfo(debug);
        
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
    return resolverFallback;
  }

  // Use internal React Router routing
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
      <Suspense fallback={resolverFallback}>
        {modeContent[appModeResult] ?? <NotFound />}
        {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={null} />}
      </Suspense>
    );
  }

  if (!resolvedRoute) {
    console.error("[PublicRouteResolver] No route resolved on production domain, showing NotFound");
    return (
      <Suspense fallback={resolverFallback}>
        <NotFound />
        {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={null} />}
      </Suspense>
    );
  }

  // Content based on route_kind
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
      if (resolvedRoute.domain_type === "io") {
        content = <Index />;
      } else if (resolvedRoute.domain_type === "community") {
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
      content = <NotFound />;
      break;
  }

  return (
    <Suspense fallback={resolverFallback}>
      {content}
      {import.meta.env.DEV && <RouteDebugBar debug={debugInfo} route={resolvedRoute} />}
    </Suspense>
  );
}
