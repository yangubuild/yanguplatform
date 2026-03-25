import { lazyRetry } from "@/lib/lazyRetry";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { AgencyShell } from "@/components/manage/AgencyShell";
import { AgencyGuard } from "@/components/manage/AgencyGuard";
import { Loader2, ShieldX } from "lucide-react";

// Agency pages
const AgencyLanding = lazy(() => lazyRetry(() => import("@/pages/auth/AgencyLanding")));
const AgencyDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyDashboard")));
const AgencyOnboarding = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyOnboarding")));
const AgencyMembersPage = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyMembersPage")));
const AgencyCommissions = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyCommissions")));
const AgencyPerformance = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyPerformance")));
const AgencyAnalytics = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyAnalytics")));
const AgencyHub = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyHub")));
const AgencySupportPage = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencySupportPage")));
const AgencySettingsPage = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencySettingsPage")));
const AgencyKYC = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyKYC")));
const AgencyPayouts = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyPayouts")));
const AgencyLogin = lazy(() => lazyRetry(() => import("@/pages/auth/AgencyLogin")));
const AuthCallback = lazy(() => lazyRetry(() => import("@/pages/auth/AuthCallback")));

function AgencyAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAnyAgencyRole, isLoading: rolesLoading } = useRoles();
  const location = useLocation();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  if (!hasAnyAgencyRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <ShieldX className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Access Restricted</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You need an agency role to access this platform.
          Contact your agency administrator for access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AgencyRoutes() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
      <Routes>
        {/* Public landing */}
        <Route path="/welcome" element={<AgencyLanding />} />

        {/* Auth */}
        <Route path="/auth/login" element={<AgencyLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/*" element={<Navigate to="/auth/login" replace />} />

        {/* Protected agency workspace */}
        <Route
          path="/"
          element={
            <AgencyAuthGuard>
              <AgencyGuard>
                <AgencyShell />
              </AgencyGuard>
            </AgencyAuthGuard>
          }>
          <Route index element={<AgencyDashboard />} />
          <Route path="analytics" element={<AgencyGuard allowedRoles={["agency_admin", "agency_manager"]}><AgencyAnalytics /></AgencyGuard>} />
          <Route path="performance" element={<AgencyPerformance />} />
          <Route path="members" element={<AgencyGuard allowedRoles={["agency_admin", "agency_manager"]}><AgencyMembersPage /></AgencyGuard>} />
          <Route path="onboarding" element={<AgencyOnboarding />} />
          <Route path="kyc" element={<AgencyGuard allowedRoles={["agency_admin"]}><AgencyKYC /></AgencyGuard>} />
          <Route path="commissions" element={<AgencyCommissions />} />
          <Route path="payouts" element={<AgencyPayouts />} />
          <Route path="hub" element={<AgencyHub />} />
          <Route path="support" element={<AgencyGuard allowedRoles={["agency_admin", "agency_manager"]}><AgencySupportPage /></AgencyGuard>} />
          <Route path="settings" element={<AgencyGuard allowedRoles={["agency_admin"]}><AgencySettingsPage /></AgencyGuard>} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/agency/*" element={<Navigate to="/" replace />} />

        {/* Catch-all → login */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
}
