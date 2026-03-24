import { lazyRetry } from "@/lib/lazyRetry";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ManagementGuard } from "./ManagementGuard";
import { AdminShell } from "./AdminShell";
import { AgencyShell } from "./AgencyShell";
import { ManageRoleGate } from "./ManageRoleGate";
import { AgencyGuard } from "./AgencyGuard";

// Management pages
const ManageDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDashboard")));
const ManageExploreDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/ManageExploreDashboard")));
const ManageAlertsSecurity = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAlertsSecurity")));
const ManageAnalytics = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAnalytics")));
const ManageUsers = lazy(() => lazyRetry(() => import("@/pages/manage/ManageUsers")));
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
const ManageKyc = lazy(() => lazyRetry(() => import("@/pages/manage/ManageKyc")));
const ManagePayments = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePayments")));
const ManageAiUsage = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAiUsage")));
const ManageIncidents = lazy(() => lazyRetry(() => import("@/pages/manage/ManageIncidents")));
const ManageCommandCenter = lazy(() => lazyRetry(() => import("@/pages/manage/ManageCommandCenter")));
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
const ManageExploreAnalytics = lazy(() => lazyRetry(() => import("@/pages/manage/ManageExploreAnalytics")));
const ManageBanners = lazy(() => lazyRetry(() => import("@/pages/manage/ManageBanners")));
const ManageReports = lazy(() => lazyRetry(() => import("@/pages/manage/ManageReports")));
const ManageSupportQueue = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSupportQueue")));
const ManageSurfaceModeration = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSurfaceModeration")));
const ManageMedia = lazy(() => lazyRetry(() => import("@/pages/manage/ManageMedia")));
const ManageNotifications = lazy(() => lazyRetry(() => import("@/pages/manage/ManageNotifications")));
const ManageAutomation = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAutomation")));
const ManageSearch = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSearch")));
const ManageAgencies = lazy(() => lazyRetry(() => import("@/pages/manage/ManageAgencies")));
const ManageSmartAlerts = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSmartAlerts")));
const ManageDataIntegrity = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDataIntegrity")));

// Agency pages
const AgencyDashboard = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyDashboard")));
const AgencyPlaceholder = lazy(() => lazyRetry(() => import("@/pages/manage/agency/AgencyPlaceholder")));

// Auth — login only, no signup
const Login = lazy(() => lazyRetry(() => import("@/pages/auth/Login")));
const AuthCallback = lazy(() => lazyRetry(() => import("@/pages/auth/AuthCallback")));

/**
 * Routes for the manage.yangu.studio control plane.
 * Two workspaces: /management/* and /agency/*
 * Root "/" redirects by role (handled in ManagementGuard).
 */
export function ManagementRoutes() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
      <Routes>
        {/* Auth routes — login only */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/signup" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/*" element={<Navigate to="/auth/login" replace />} />

        {/* Root — role-based redirect (ManagementGuard handles the redirect) */}
        <Route
          path="/"
          element={
            <ManagementGuard>
              {/* If ManagementGuard doesn't redirect, show nothing — shouldn't happen */}
              <Navigate to="/management" replace />
            </ManagementGuard>
          }
        />

        {/* ═══════════════ MANAGEMENT WORKSPACE ═══════════════ */}
        <Route
          path="/management"
          element={
            <ManagementGuard>
              <AdminShell />
            </ManagementGuard>
          }>
          <Route index element={<ManageDashboard />} />
          <Route path="explore-dashboard" element={<ManageRoleGate allowedRoles={["admin"]}><ManageExploreDashboard /></ManageRoleGate>} />
          <Route path="ada" element={<ManageAda />} />
          <Route path="messages" element={<ManageMessages />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="team" element={<ManageTeam />} />
          <Route path="pricing" element={<ManageRoleGate allowedRoles={["admin"]}><ManagePricing /></ManageRoleGate>} />
          <Route path="promos" element={<ManageRoleGate allowedRoles={["admin"]}><ManagePromos /></ManageRoleGate>} />
          <Route path="surfaces" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSurfaces /></ManageRoleGate>} />
          <Route path="navigation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageNavigation /></ManageRoleGate>} />
          <Route path="community" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageCommunity /></ManageRoleGate>} />
          <Route path="agents" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAgents /></ManageRoleGate>} />
          <Route path="domains" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDomains /></ManageRoleGate>} />
          <Route path="kyc" element={<ManageRoleGate allowedRoles={["admin"]}><ManageKyc /></ManageRoleGate>} />
          <Route path="payments" element={<ManageRoleGate allowedRoles={["admin"]}><ManagePayments /></ManageRoleGate>} />
          <Route path="ai-usage" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAiUsage /></ManageRoleGate>} />
          <Route path="incidents" element={<ManageRoleGate allowedRoles={["admin"]}><ManageIncidents /></ManageRoleGate>} />
          <Route path="command-center" element={<ManageRoleGate allowedRoles={["admin"]}><ManageCommandCenter /></ManageRoleGate>} />
          <Route path="analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageAnalytics /></ManageRoleGate>} />
          <Route path="content" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageContentHome /></ManageRoleGate>} />
          <Route path="content/blog" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageBlog /></ManageRoleGate>} />
          <Route path="content/news" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageNews /></ManageRoleGate>} />
          <Route path="content/events" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageEvents /></ManageRoleGate>} />
          <Route path="branding" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManageBranding /></ManageRoleGate>} />
          <Route path="pages" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePages /></ManageRoleGate>} />
          <Route path="integrations" element={<ManageRoleGate allowedRoles={["admin"]}><ManageIntegrations /></ManageRoleGate>} />
          <Route path="research-testing" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageResearchTesting /></ManageRoleGate>} />
          <Route path="alerts-security" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAlertsSecurity /></ManageRoleGate>} />
          <Route path="app-review" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAppReview /></ManageRoleGate>} />
          <Route path="entities" element={<ManageRoleGate allowedRoles={["admin"]}><ManageEntities /></ManageRoleGate>} />
          <Route path="reports" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageReports /></ManageRoleGate>} />
          <Route path="support" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSupportQueue /></ManageRoleGate>} />
          <Route path="explore-analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageExploreAnalytics /></ManageRoleGate>} />
          <Route path="banners" element={<ManageRoleGate allowedRoles={["admin", "content_editor"]}><ManageBanners /></ManageRoleGate>} />
          <Route path="surface-moderation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSurfaceModeration /></ManageRoleGate>} />
          <Route path="media" element={<ManageRoleGate allowedRoles={["admin"]}><ManageMedia /></ManageRoleGate>} />
          <Route path="notifications" element={<ManageRoleGate allowedRoles={["admin"]}><ManageNotifications /></ManageRoleGate>} />
          <Route path="automation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAutomation /></ManageRoleGate>} />
          <Route path="search" element={<ManageRoleGate allowedRoles={["admin", "moderator", "support"]}><ManageSearch /></ManageRoleGate>} />
          <Route path="agencies" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAgencies /></ManageRoleGate>} />
          <Route path="smart-alerts" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSmartAlerts /></ManageRoleGate>} />
          <Route path="data-integrity" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDataIntegrity /></ManageRoleGate>} />
          <Route path="settings" element={<ManageSettings />} />
          <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageAuditLogs /></ManageRoleGate>} />
          <Route path="*" element={<ManageNotFound />} />
        </Route>

        {/* ═══════════════ AGENCY WORKSPACE ═══════════════ */}
        <Route
          path="/agency"
          element={
            <ManagementGuard>
              <AgencyGuard>
                <AgencyShell />
              </AgencyGuard>
            </ManagementGuard>
          }>
          <Route index element={<AgencyDashboard />} />
          <Route path="analytics" element={<AgencyPlaceholder />} />
          <Route path="performance" element={<AgencyPlaceholder />} />
          <Route path="members" element={<AgencyPlaceholder />} />
          <Route path="onboarding" element={<AgencyPlaceholder />} />
          <Route path="kyc" element={<AgencyGuard allowedRoles={["agency_admin"]}><AgencyPlaceholder /></AgencyGuard>} />
          <Route path="commissions" element={<AgencyPlaceholder />} />
          <Route path="pricing" element={<AgencyGuard allowedRoles={["agency_admin"]}><AgencyPlaceholder /></AgencyGuard>} />
          <Route path="support" element={<AgencyGuard allowedRoles={["agency_admin", "agency_manager"]}><AgencyPlaceholder /></AgencyGuard>} />
          <Route path="*" element={<AgencyPlaceholder />} />
        </Route>

        {/* Catch-all — redirect to role router */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
