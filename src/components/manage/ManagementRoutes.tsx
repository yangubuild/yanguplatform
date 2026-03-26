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

// NEW Phase sections
const ManagePlatformHealth = lazy(() => lazyRetry(() => import("@/pages/manage/ManagePlatformHealth")));
const ManageLaunchCounter = lazy(() => lazyRetry(() => import("@/pages/manage/ManageLaunchCounter")));
const ManageEngineer = lazy(() => lazyRetry(() => import("@/pages/manage/ManageEngineer")));
const ManageDesignStudio = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDesignStudio")));
const ManageDigitalMarketing = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDigitalMarketing")));
const ManageDepartmentReports = lazy(() => lazyRetry(() => import("@/pages/manage/ManageDepartmentReports")));
const ManageSalesMarketing = lazy(() => lazyRetry(() => import("@/pages/manage/ManageSalesMarketing")));
const ManageManagementKyc = lazy(() => lazyRetry(() => import("@/pages/manage/ManageManagementKyc")));

// Agency pages
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

// Auth
const Login = lazy(() => lazyRetry(() => import("@/pages/auth/Login")));
const AuthCallback = lazy(() => lazyRetry(() => import("@/pages/auth/AuthCallback")));

export function ManagementRoutes() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/signup" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/*" element={<Navigate to="/auth/login" replace />} />

        {/* ═══════════ MANAGEMENT WORKSPACE ═══════════ */}
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
          <Route path="payments" element={<ManageRoleGate allowedRoles={["admin", "finance_lead"]}><ManagePayments /></ManageRoleGate>} />
          <Route path="ai-usage" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAiUsage /></ManageRoleGate>} />
          <Route path="incidents" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManageIncidents /></ManageRoleGate>} />
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
          <Route path="support" element={<ManageRoleGate allowedRoles={["admin", "support_lead"]}><ManageSupportQueue /></ManageRoleGate>} />
          <Route path="explore-analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageExploreAnalytics /></ManageRoleGate>} />
          <Route path="banners" element={<ManageRoleGate allowedRoles={["admin", "content_editor"]}><ManageBanners /></ManageRoleGate>} />
          <Route path="surface-moderation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSurfaceModeration /></ManageRoleGate>} />
          <Route path="media" element={<ManageRoleGate allowedRoles={["admin"]}><ManageMedia /></ManageRoleGate>} />
          <Route path="notifications" element={<ManageRoleGate allowedRoles={["admin"]}><ManageNotifications /></ManageRoleGate>} />
          <Route path="automation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAutomation /></ManageRoleGate>} />
          <Route path="search" element={<ManageRoleGate allowedRoles={["admin", "moderator", "support_lead"]}><ManageSearch /></ManageRoleGate>} />
          <Route path="agencies" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAgencies /></ManageRoleGate>} />
          <Route path="smart-alerts" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSmartAlerts /></ManageRoleGate>} />
          <Route path="data-integrity" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDataIntegrity /></ManageRoleGate>} />
          {/* NEW Phase sections */}
          <Route path="platform-health" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManagePlatformHealth /></ManageRoleGate>} />
          <Route path="launch-counter" element={<ManageRoleGate allowedRoles={["admin"]}><ManageLaunchCounter /></ManageRoleGate>} />
          <Route path="engineer" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManageEngineer /></ManageRoleGate>} />
          <Route path="design-studio" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManageDesignStudio /></ManageRoleGate>} />
          <Route path="digital-marketing" element={<ManageRoleGate allowedRoles={["admin", "social_digital"]}><ManageDigitalMarketing /></ManageRoleGate>} />
          <Route path="department-reports" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDepartmentReports /></ManageRoleGate>} />
          <Route path="sales-marketing" element={<ManageRoleGate allowedRoles={["admin", "sales_marketing"]}><ManageSalesMarketing /></ManageRoleGate>} />
          <Route path="management-kyc" element={<ManageRoleGate allowedRoles={["admin", "owner"]}><ManageManagementKyc /></ManageRoleGate>} />
          <Route path="settings" element={<ManageSettings />} />
          <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageAuditLogs /></ManageRoleGate>} />
          <Route path="*" element={<ManageNotFound />} />
        </Route>

        {/* ═══════════ AGENCY WORKSPACE (ROOT ROUTES) ═══════════ */}
        <Route
          path="/"
          element={
            <ManagementGuard>
              <AgencyGuard>
                <AgencyShell />
              </AgencyGuard>
            </ManagementGuard>
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

        {/* ═══════════ LEGACY /agency/* REDIRECTS ═══════════ */}
        <Route path="/agency" element={<Navigate to="/" replace />} />
        <Route path="/agency/analytics" element={<Navigate to="/analytics" replace />} />
        <Route path="/agency/performance" element={<Navigate to="/performance" replace />} />
        <Route path="/agency/members" element={<Navigate to="/members" replace />} />
        <Route path="/agency/onboarding" element={<Navigate to="/onboarding" replace />} />
        <Route path="/agency/kyc" element={<Navigate to="/kyc" replace />} />
        <Route path="/agency/commissions" element={<Navigate to="/commissions" replace />} />
        <Route path="/agency/hub" element={<Navigate to="/hub" replace />} />
        <Route path="/agency/support" element={<Navigate to="/support" replace />} />
        <Route path="/agency/settings" element={<Navigate to="/settings" replace />} />
        <Route path="/agency/*" element={<Navigate to="/" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
