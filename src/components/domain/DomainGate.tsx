import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDomain, useDomainRoute } from "@/contexts/DomainContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DomainGateProps {
  children: ReactNode;
  /** If true, shows loading state while domain resolves */
  showLoading?: boolean;
  /** Route to redirect to if domain is inactive */
  inactiveRedirect?: string;
}

/**
 * DomainGate wraps routes that should only be accessible
 * on certain domain types. It checks if the current route
 * is allowed for the active domain and redirects if not.
 */
export function DomainGate({ 
  children, 
  showLoading = true,
  inactiveRedirect = "/" 
}: DomainGateProps) {
  const location = useLocation();
  const { isLoading, isActive, error, routeConfig, domainType } = useDomain();
  const isRouteAllowed = useDomainRoute(location.pathname);

  // Show loading state while resolving domain
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Resolving domain...</p>
        </div>
      </div>
    );
  }

  // Show inactive domain page
  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Domain Inactive</h1>
            <p className="text-muted-foreground">
              This domain is currently not active. Please contact the administrator
              or visit the main platform.
            </p>
          </div>
          <Button asChild>
            <a href="https://yangu.io">Go to YANGU</a>
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if route not allowed for this domain type
  if (!isRouteAllowed) {
    console.warn(
      `Route "${location.pathname}" not allowed on domain type "${domainType}". Redirecting to ${routeConfig.defaultRoute}`
    );
    return <Navigate to={routeConfig.defaultRoute} replace />;
  }

  return <>{children}</>;
}

/**
 * DomainRouteGuard is a simpler version that only checks
 * if the route is allowed without showing loading states.
 * Use this for wrapping individual route elements.
 */
export function DomainRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { routeConfig, domainType } = useDomain();
  const isRouteAllowed = useDomainRoute(location.pathname);

  if (!isRouteAllowed) {
    console.warn(
      `Route "${location.pathname}" not allowed on domain type "${domainType}".`
    );
    return <Navigate to={routeConfig.defaultRoute} replace />;
  }

  return <>{children}</>;
}
