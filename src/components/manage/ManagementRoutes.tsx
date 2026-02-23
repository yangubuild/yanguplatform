import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ManagementGuard } from "./ManagementGuard";
import { AdminShell } from "./AdminShell";
import { ManageRoleGate } from "./ManageRoleGate";

const ManageDashboard = lazy(() => import("@/pages/manage/ManageDashboard"));
const ManageUsers = lazy(() => import("@/pages/manage/ManageUsers"));
const ManagePlaceholder = lazy(() => import("@/pages/manage/ManagePlaceholder"));
const ManageNotFound = lazy(() => import("@/pages/manage/ManageNotFound"));
const ManageSurfaces = lazy(() => import("@/pages/manage/ManageSurfaces"));
const ManageNavigation = lazy(() => import("@/pages/manage/ManageNavigation"));
const ManageCommunity = lazy(() => import("@/pages/manage/ManageCommunity"));
const ManageBlog = lazy(() => import("@/pages/manage/ManageBlog"));
const ManageAda = lazy(() => import("@/pages/manage/ManageAda"));
const ManageMessages = lazy(() => import("@/pages/manage/ManageMessages"));
const ManageNews = lazy(() => import("@/pages/manage/ManageNews"));
const ManageEvents = lazy(() => import("@/pages/manage/ManageEvents"));
const ManageContentHome = lazy(() => import("@/pages/manage/ManageContentHome"));
const ManagePricing = lazy(() => import("@/pages/manage/ManagePricing"));
const ManagePromos = lazy(() => import("@/pages/manage/ManagePromos"));
const ManageTeam = lazy(() => import("@/pages/manage/ManageTeam"));
const ManageAppReview = lazy(() => import("@/pages/manage/ManageAppReview"));

/**
 * Routes for the management subdomain (manage.yangu.studio).
 * Renders management panel only — no dashboard, developer, or platform routes.
 */
export function ManagementRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Auth route passthrough */}
        <Route path="/auth/*" element={<AuthPassthrough />} />

        {/* Management panel */}
        <Route
          path="/"
          element={
            <ManagementGuard>
              <AdminShell />
            </ManagementGuard>
          }
        >
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<ManageDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="moderation" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageCommunity /></ManageRoleGate>} />
          <Route path="logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManagePlaceholder /></ManageRoleGate>} />
          <Route path="settings" element={<ManagePlaceholder />} />
          {/* Extended management routes */}
          <Route path="ada" element={<ManageAda />} />
          <Route path="messages" element={<ManageMessages />} />
          <Route path="team" element={<ManageTeam />} />
          <Route path="pricing" element={<ManagePricing />} />
          <Route path="promos" element={<ManagePromos />} />
          <Route path="surfaces" element={<ManageSurfaces />} />
          <Route path="navigation" element={<ManageNavigation />} />
          <Route path="community" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageCommunity /></ManageRoleGate>} />
          <Route path="analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManagePlaceholder /></ManageRoleGate>} />
          <Route path="content" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageContentHome /></ManageRoleGate>} />
          <Route path="content/blog" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageBlog /></ManageRoleGate>} />
          <Route path="content/news" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageNews /></ManageRoleGate>} />
          <Route path="content/events" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageEvents /></ManageRoleGate>} />
          <Route path="branding" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePlaceholder /></ManageRoleGate>} />
          <Route path="pages" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePlaceholder /></ManageRoleGate>} />
          <Route path="integrations" element={<ManagePlaceholder />} />
          <Route path="alerts-security" element={<ManagePlaceholder />} />
          <Route path="app-review" element={<ManageAppReview />} />
          <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManagePlaceholder /></ManageRoleGate>} />
          <Route path="*" element={<ManageNotFound />} />
        </Route>

        {/* Block all non-management routes */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </Suspense>
  );
}

/** Passthrough for /auth/* routes within management subdomain */
function AuthPassthrough() {
  // Import auth pages lazily
  const Login = lazy(() => import("@/pages/auth/Login"));
  const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  );
}
