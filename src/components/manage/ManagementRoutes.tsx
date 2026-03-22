import { lazyRetry } from "@/lib/lazyRetry";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ManagementGuard } from "./ManagementGuard";
import { AdminShell } from "./AdminShell";
import { ManageRoleGate } from "./ManageRoleGate";

const ManageDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDashboard")));
const ManageExploreDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/ManageExploreDashboard")));
const ManageAlertsSecurity = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAlertsSecurity")));
const ManageAnalytics = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAnalytics")));
const ManageUsers = lazy(() => lazyRetry(() => import("@/pages/manage/ManageUsers")));
const ManagePlaceholder = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePlaceholder")));
const ManageAgents = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAgents")));
const ManageIntegrations = lazy(() => lazyRetry(() => import("@/pages/manage/ManageIntegrations")));
const ManagePages = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePages")));
const ManageBranding = lazy(() => lazyRetry(() => import("@/pages/manage/ManageBranding")));
const ManageResearchTesting = lazy(() => lazyRetry(() => import("@/pages/manage/ManageResearchTesting")));
const ManageAuditLogs = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAuditLogs")));
const ManageSettings = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSettings")));
const ManageNotFound = lazy(() => lazyRetry(() => import("@/pages/manage/ManageNotFound")));
const ManageSurfaces = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSurfaces")));
const ManageDomains = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDomains")));
const ManageNavigation = lazy(() => lazyRetry(() => import("@/pages/manage/ManageNavigation")));
const ManageCommunity = lazy(() => lazyRetry(() => import("@/pages/manage/ManageCommunity")));
const ManageBlog = lazy(() => lazyRetry(() => import("@/pages/manage/ManageBlog")));
const ManageAda = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAda")));
const ManageMessages = lazy(() => lazyRetry(() => import("@/pages/manage/ManageMessages")));
const ManageNews = lazy(() => lazyRetry(() => import("@/pages/manage/ManageNews")));
const ManageEvents = lazy(() => lazyRetry(() => import("@/pages/manage/ManageEvents")));
const ManageContentHome = lazy(() => lazyRetry(() => import("@/pages/manage/ManageContentHome")));
const ManagePricing = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePricing")));
const ManagePromos = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePromos")));
const ManageTeam = lazy(() => lazyRetry(() => import("@/pages/manage/ManageTeam")));
const ManageAppReview = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAppReview")));
const ManageEntities = lazy(() => lazyRetry(() => import("@/pages/manage/ManageEntities")));

// Auth — login only, no signup
const Login = lazy(() => lazyRetry(() => import("@/pages/auth/Login")));
const AuthCallback = lazy(() => lazyRetry(() => import("@/pages/auth/AuthCallback")));

/**
 * Routes for the management subdomain (manage.yangu.studio).
 * Completely isolated runtime — no landing page, no domain gate, no platform routes.
 * Signup is disabled; login only.
 *
 * Route definitions mirror App.tsx /manage/* exactly to prevent drift.
 */
export function ManagementRoutes() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
      <Routes>
        {/* Auth routes — login only */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Block signup — redirect to login */}
        <Route path="/auth/signup" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/*" element={<Navigate to="/auth/login" replace />} />

        {/* Management panel */}
        <Route
          path="/"
          element={
            <ManagementGuard>
              <AdminShell />
            </ManagementGuard>
          }
        >
          <Route index element={<ManageDashboard />} />
          <Route path="explore-dashboard" element={<ManageRoleGate allowedRoles={["admin"]}><ManageExploreDashboard /></ManageRoleGate>} />
          <Route path="ada" element={<ManageAda />} />
          <Route path="messages" element={<ManageMessages />} />
          {/* Platform */}
          <Route path="users" element={<ManageUsers />} />
          <Route path="team" element={<ManageTeam />} />
          <Route path="pricing" element={<ManageRoleGate allowedRoles={["admin"]}><ManagePricing /></ManageRoleGate>} />
          <Route path="promos" element={<ManageRoleGate allowedRoles={["admin"]}><ManagePromos /></ManageRoleGate>} />
          <Route path="surfaces" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSurfaces /></ManageRoleGate>} />
          <Route path="navigation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageNavigation /></ManageRoleGate>} />
          <Route path="community" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageCommunity /></ManageRoleGate>} />
          <Route path="agents" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAgents /></ManageRoleGate>} />
          <Route path="domains" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDomains /></ManageRoleGate>} />
          {/* Analytics */}
          <Route path="analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageAnalytics /></ManageRoleGate>} />
          {/* Content */}
          <Route path="content" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageContentHome /></ManageRoleGate>} />
          <Route path="content/blog" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageBlog /></ManageRoleGate>} />
          <Route path="content/news" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageNews /></ManageRoleGate>} />
          <Route path="content/events" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageEvents /></ManageRoleGate>} />
          {/* Design & Pages */}
          <Route path="branding" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManageBranding /></ManageRoleGate>} />
          <Route path="pages" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePages /></ManageRoleGate>} />
          {/* Operations */}
          <Route path="integrations" element={<ManageRoleGate allowedRoles={["admin"]}><ManageIntegrations /></ManageRoleGate>} />
          <Route path="research-testing" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageResearchTesting /></ManageRoleGate>} />
          <Route path="alerts-security" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAlertsSecurity /></ManageRoleGate>} />
          <Route path="app-review" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAppReview /></ManageRoleGate>} />
          <Route path="entities" element={<ManageRoleGate allowedRoles={["admin"]}><ManageEntities /></ManageRoleGate>} />
          {/* System */}
          <Route path="settings" element={<ManageSettings />} />
          <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageAuditLogs /></ManageRoleGate>} />
          <Route path="*" element={<ManageNotFound />} />
        </Route>

        {/* Catch-all — redirect to panel root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
