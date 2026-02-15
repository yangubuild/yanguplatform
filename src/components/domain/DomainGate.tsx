import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useDomain } from "@/contexts/DomainContext";
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
 * DomainGate provides domain context awareness.
 * 
 * IMPORTANT: Route access control is now handled by PublicRouteResolver via RPC.
 * DomainGate only handles:
 * 1. Loading state while domain context initializes
 * 2. Inactive domain display
 * 
 * It does NOT redirect based on route patterns - that's the job of PublicRouteResolver.
 */
export function DomainGate({ 
  children, 
  showLoading = true,
}: DomainGateProps) {
  const location = useLocation();
  const { isLoading, isActive, domainType } = useDomain();
  
  // Debug logging (dev only)
  if (import.meta.env.DEV) {
    console.log("[DomainGate] Allowing through:", {
      pathname: location.pathname,
      domainType,
      isActive,
    });
  }

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

  // Show inactive domain page (only for explicitly inactive domains)
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

  // Let all routes through - PublicRouteResolver handles routing via RPC
  return <>{children}</>;
}

/**
 * DomainRouteGuard - DEPRECATED
 * Route access control is now handled by PublicRouteResolver.
 * This component just passes through children.
 */
export function DomainRouteGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
