import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";

/**
 * App-domain root behaviour.
 *
 * On the application domain (app.yangu.io) the public marketing landing page is
 * no longer served — marketing lives on yangu.io. Instead:
 *  - unauthenticated visitors are sent to /login
 *  - authenticated users go straight to /dashboard
 *    (ProtectedRoute still routes them to /onboarding when incomplete)
 *
 * Every other host keeps the existing landing page untouched.
 */
function isAppDomain(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.replace(/^www\./, "").toLowerCase();
  return host === "app.yangu.io";
}

export function RootRoute() {
  const appDomain = isAppDomain();
  const { isAuthenticated, isLoading } = useAuth();

  if (!appDomain) return <Index />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default RootRoute;
