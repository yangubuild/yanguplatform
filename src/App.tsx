import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { DomainProvider } from "@/contexts/DomainContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DomainGate } from "@/components/domain/DomainGate";
import { PublicRouteResolver } from "@/components/routing";
import { ConsoleAuthGuard } from "@/components/developers/ConsoleAuthGuard";
import { DeveloperPortalGuard } from "@/components/developers/DeveloperPortalGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";
import UpdatePassword from "./pages/auth/UpdatePassword";
import AuthCallback from "./pages/auth/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SurfacePreview from "./pages/SurfacePreview";
import PublicSurfacePage from "./pages/PublicSurfacePage";
import SurfaceEditor from "./pages/SurfaceEditor";
import KYC from "./pages/KYC";
import Billing from "./pages/Billing";
import DevSeed from "./pages/dev/DevSeed";
import TestDomainVerification from "./pages/dev/TestDomainVerification";
import Subscriptions from "./pages/Subscriptions";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell } from "@/components/manage/AdminShell";
import { ManageRoleGate } from "@/components/manage/ManageRoleGate";
import { RequireRole } from "@/components/auth/RequireRole";

// Lazy-loaded route bundles to eliminate navigation lag
import Studio from "./pages/Studio";
import ImageAdsFlow from "./components/studio/image-ads/ImageAdsFlow";
import Community from "./pages/Community";
import AdaAi from "./pages/AdaAi";
import WhyYangu from "./pages/WhyYangu";
import DiscoverYangu from "./pages/DiscoverYangu";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdaLanding from "./pages/AdaLanding";

// Developer platform (lazy)
const DevelopersLayout = lazy(() => import("./components/developers/DevelopersLayout").then(m => ({ default: m.DevelopersLayout })));
const DevelopersHome = lazy(() => import("./pages/developers/DevelopersHome"));
const DocsQuickstart = lazy(() => import("./pages/developers/DocsQuickstart"));
const DocsPlaceholder = lazy(() => import("./pages/developers/DocsPlaceholder"));
const ConsoleHome = lazy(() => import("./pages/developers/console/ConsoleHome"));
const ConsoleApps = lazy(() => import("./pages/developers/console/ConsoleApps"));
const ConsoleAppDetail = lazy(() => import("./pages/developers/console/ConsoleAppDetail"));
const ConsoleSubmissions = lazy(() => import("./pages/developers/console/ConsoleSubmissions"));
const ConsoleNewSubmission = lazy(() => import("./pages/developers/console/ConsoleNewSubmission"));
const ConsoleOverview = lazy(() => import("./pages/developers/console/ConsoleOverview"));
const ConsolePermissions = lazy(() => import("./pages/developers/console/ConsolePermissions"));
const ConsoleRuntime = lazy(() => import("./pages/developers/console/ConsoleRuntime"));
const ConsoleWidgets = lazy(() => import("./pages/developers/console/ConsoleWidgets"));
const ConsoleInstalls = lazy(() => import("./pages/developers/console/ConsoleInstalls"));
const StoreBrowse = lazy(() => import("./pages/developers/store/StoreBrowse"));
const StoreListing = lazy(() => import("./pages/developers/store/StoreListing"));
const StoreInstall = lazy(() => import("./pages/developers/store/StoreInstall"));
const ManageAppReview = lazy(() => import("./pages/manage/ManageAppReview"));

// Developer Portal (lazy)
const PortalLayoutModule = lazy(() => import("./components/developers/portal/PortalLayout").then(m => ({ default: m.PortalLayout })));
const PortalOverview = lazy(() => import("./pages/developers/portal/PortalOverview"));
const PortalApps = lazy(() => import("./pages/developers/portal/PortalApps"));
const PortalApiKeys = lazy(() => import("./pages/developers/portal/PortalApiKeys"));
const PortalSettings = lazy(() => import("./pages/developers/portal/PortalSettings"));
const PortalBilling = lazy(() => import("./pages/developers/portal/PortalBilling"));
const PortalAppDetail = lazy(() => import("./pages/developers/portal/PortalAppDetail"));
const PortalProfile = lazy(() => import("./pages/developers/portal/PortalProfile"));
const PortalWebhooks = lazy(() => import("./pages/developers/portal/PortalWebhooks"));
const PortalLogs = lazy(() => import("./pages/developers/portal/PortalLogs"));
const BuilderDocsPage = lazy(() => import("./pages/developers/docs/builders/BuilderDocsPage"));

const ManageDashboard = lazy(() => import("./pages/manage/ManageDashboard"));
const ManagePlaceholder = lazy(() => import("./pages/manage/ManagePlaceholder"));
const ManageNotFound = lazy(() => import("./pages/manage/ManageNotFound"));
const ManageUsers = lazy(() => import("./pages/manage/ManageUsers"));
const ManageSurfaces = lazy(() => import("./pages/manage/ManageSurfaces"));
const ManageNavigation = lazy(() => import("./pages/manage/ManageNavigation"));
const ManageCommunity = lazy(() => import("./pages/manage/ManageCommunity"));
const ManageBlog = lazy(() => import("./pages/manage/ManageBlog"));
const ManageAda = lazy(() => import("./pages/manage/ManageAda"));
const ManageMessages = lazy(() => import("./pages/manage/ManageMessages"));
const ManageNews = lazy(() => import("./pages/manage/ManageNews"));
const ManageEvents = lazy(() => import("./pages/manage/ManageEvents"));
const ManageContentHome = lazy(() => import("./pages/manage/ManageContentHome"));
const ManagePricing = lazy(() => import("./pages/manage/ManagePricing"));
const ManagePromos = lazy(() => import("./pages/manage/ManagePromos"));
const ManageTeam = lazy(() => import("./pages/manage/ManageTeam"));

// App Shell + dashboard pages
import { NavigationDashboardPage } from "@/components/mass/navigation";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardPlaceholder from "./pages/dashboard/DashboardPlaceholder";
import DashboardExplore from "./pages/dashboard/DashboardExplore";
// DashboardModuleLayout removed — routes are flat under /dashboard/*
import ProfilePage from "./pages/dashboard/ProfilePage";
import EditProfilePage from "./pages/dashboard/EditProfilePage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import AgencyLayout from "./pages/dashboard/AgencyLayout";
import AgencyHomePage from "./pages/dashboard/AgencyHomePage";
import AgencyAnalyticsPage from "./pages/dashboard/AgencyAnalyticsPage";
import AgencyMembersPage from "./pages/dashboard/AgencyMembersPage";
import AgencyPricingPage from "./pages/dashboard/AgencyPricingPage";
import AgencySupportPage from "./pages/dashboard/AgencySupportPage";
import MessagesPage from "./pages/dashboard/MessagesPage";
import { DashboardRoleGate } from "@/components/auth/DashboardRoleGate";

// Supabase client auto-configured via environment

/**
 * App component - contains all providers EXCEPT QueryClientProvider
 * QueryClientProvider is in main.tsx to ensure it wraps the entire app
 */
const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DomainProvider>
            <PublicRouteResolver>
              <DomainGate>
              <Suspense fallback={null}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/community/*" element={<Community />} />
                <Route path="/why-yangu" element={<WhyYangu />} />
                <Route path="/discover" element={<DiscoverYangu />} />
                <Route path="/discover-yangu" element={<DiscoverYangu />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Developer platform */}
                <Route path="/developers" element={<DevelopersLayout />}>
                  <Route index element={<DevelopersHome />} />
                  <Route path="quickstart" element={<DocsQuickstart />} />
                  <Route path="apis/rest-graphql" element={<DocsPlaceholder />} />
                  <Route path="apis/authentication" element={<DocsPlaceholder />} />
                  <Route path="apis/webhooks" element={<DocsPlaceholder />} />
                  <Route path="apis/data" element={<DocsPlaceholder />} />
                  <Route path="tools/cli" element={<DocsPlaceholder />} />
                  <Route path="tools/sdks" element={<DocsPlaceholder />} />
                  <Route path="tools/edge-functions" element={<DocsPlaceholder />} />
                  <Route path="extensibility/apps" element={<DocsPlaceholder />} />
                  <Route path="extensibility/widgets" element={<DocsPlaceholder />} />
                  <Route path="extensibility/providers" element={<DocsPlaceholder />} />
                  <Route path="infrastructure/custom-domains" element={<DocsPlaceholder />} />
                  <Route path="infrastructure/environments" element={<DocsPlaceholder />} />
                  <Route path="infrastructure/rate-limits-credits" element={<DocsPlaceholder />} />
                  <Route path="infrastructure/logs-status" element={<DocsPlaceholder />} />
                  <Route path="infrastructure/changelog" element={<DocsPlaceholder />} />
                  {/* Builder docs */}
                  <Route path="docs/builders/:feature" element={<BuilderDocsPage />} />
                  {/* Console (protected by ConsoleAuthGuard) */}
                  <Route path="console" element={<ConsoleAuthGuard><ConsoleHome /></ConsoleAuthGuard>} />
                  <Route path="console/apps" element={<ConsoleAuthGuard><ConsoleApps /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId/keys" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId/oauth" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId/webhooks" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId/logs" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/apps/:appId/permissions" element={<ConsoleAuthGuard><ConsoleAppDetail /></ConsoleAuthGuard>} />
                  <Route path="console/submissions" element={<ConsoleAuthGuard><ConsoleSubmissions /></ConsoleAuthGuard>} />
                  <Route path="console/submissions/new" element={<ConsoleAuthGuard><ConsoleNewSubmission /></ConsoleAuthGuard>} />
                  {/* Developer Console — runtime management */}
                  <Route path="console/overview" element={<ConsoleAuthGuard><ConsoleOverview /></ConsoleAuthGuard>} />
                  <Route path="console/permissions" element={<ConsoleAuthGuard><ConsolePermissions /></ConsoleAuthGuard>} />
                  <Route path="console/runtime" element={<ConsoleAuthGuard><ConsoleRuntime /></ConsoleAuthGuard>} />
                  <Route path="console/widgets" element={<ConsoleAuthGuard><ConsoleWidgets /></ConsoleAuthGuard>} />
                  <Route path="console/installs" element={<ConsoleAuthGuard><ConsoleInstalls /></ConsoleAuthGuard>} />
                  {/* App Store */}
                  <Route path="store" element={<StoreBrowse />} />
                  <Route path="store/:appSlug" element={<StoreListing />} />
                  <Route path="store/:appSlug/install" element={<StoreInstall />} />
                </Route>

                {/* Developer Portal (protected) */}
                <Route
                  path="/developers/portal"
                  element={
                    <DeveloperPortalGuard>
                      <PortalLayoutModule />
                    </DeveloperPortalGuard>
                  }
                >
                  <Route index element={<Navigate to="/developers/portal/overview" replace />} />
                  <Route path="overview" element={<PortalOverview />} />
                  <Route path="apps" element={<PortalApps />} />
                  <Route path="apps/:id" element={<PortalAppDetail />} />
                  <Route path="api-keys" element={<PortalApiKeys />} />
                  <Route path="webhooks" element={<PortalWebhooks />} />
                  <Route path="logs" element={<PortalLogs />} />
                  <Route path="profile" element={<PortalProfile />} />
                  <Route path="settings" element={<PortalSettings />} />
                  <Route path="billing" element={<PortalBilling />} />
                </Route>
                
                {/* Owner preview route - requires auth + ownership */}
                <Route path="/s/:id/preview" element={<SurfacePreview />} />
                
                {/* Public surface routes - domain-scoped resolution */}
                <Route path="/surface" element={<PublicSurfacePage />} />
                <Route path="/@:username" element={<PublicSurfacePage />} />
                <Route path="/store" element={<PublicSurfacePage />} />
                <Route path="/storefront" element={<PublicSurfacePage />} />
                <Route path="/services" element={<PublicSurfacePage />} />
                <Route path="/portfolio" element={<PublicSurfacePage />} />
                <Route path="/live" element={<PublicSurfacePage />} />
                <Route path="/feed" element={<PublicSurfacePage />} />
                <Route path="/groups" element={<PublicSurfacePage />} />
                
                {/* Dynamic slug routes - resolved by PublicRouteResolver via RPC */}
                <Route path="/:slug" element={<PublicSurfacePage />} />
                
                {/* Auth routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/update-password" element={<UpdatePassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Onboarding - requires auth but not completed onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute requireOnboarding={false}>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                
                {/* ====== APP SHELL: /dashboard/* ====== */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <NavigationDashboardPage />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="explore" element={<DashboardExplore />} />
                  <Route path="offers" element={<DashboardPlaceholder />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="ada" element={<AdaAi />} />
                  <Route path="studio" element={<Studio />} />
                  <Route path="studio/image-ads" element={<ImageAdsFlow />} />
                  <Route path="influencer" element={<DashboardPlaceholder />} />
                  <Route path="visionaire" element={<DashboardPlaceholder />} />
                  <Route path="app-store" element={<DashboardPlaceholder />} />
                  <Route path="community" element={<Navigate to="/community" replace />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="profile/edit" element={<EditProfilePage />} />
                  <Route path="profile/subscription" element={<SubscriptionPage />} />

                  {/* Dashboard module pages (flat, no nesting) */}
                  <Route path="my-apps" element={<DashboardPlaceholder />} />
                  <Route path="my-business" element={<DashboardPlaceholder />} />
                  <Route path="payments" element={<DashboardPlaceholder />} />
                  <Route path="invoices" element={<DashboardPlaceholder />} />
                  <Route path="ads" element={<DashboardPlaceholder />} />
                  <Route path="promo-codes" element={<DashboardPlaceholder />} />
                  <Route path="affiliates" element={<DashboardPlaceholder />} />

                  {/* Legacy /dashboard/dashboard/* redirects */}
                  <Route path="dashboard" element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard/profile" element={<Navigate to="/dashboard/profile" replace />} />
                  <Route path="dashboard/profile/*" element={<Navigate to="/dashboard/profile" replace />} />
                  <Route path="dashboard/agency" element={<Navigate to="/dashboard/agency" replace />} />
                  <Route path="dashboard/agency/*" element={<Navigate to="/dashboard/agency" replace />} />
                  <Route path="dashboard/*" element={<Navigate to="/dashboard" replace />} />

                  {/* Agency routes — agency only */}
                  <Route path="agency" element={<RequireRole allowed={["agency"]}><AgencyLayout /></RequireRole>}>
                    <Route index element={<AgencyHomePage />} />
                    <Route path="analytics" element={<AgencyAnalyticsPage />} />
                    <Route path="members" element={<AgencyMembersPage />} />
                    <Route path="pricing" element={<AgencyPricingPage />} />
                    <Route path="support" element={<AgencySupportPage />} />
                  </Route>

                  {/* Seller nested routes */}
                  <Route path="seller/eshop" element={<DashboardPlaceholder />} />
                  <Route path="seller/estore" element={<DashboardPlaceholder />} />
                  <Route path="seller/emenu" element={<DashboardPlaceholder />} />
                  <Route path="seller/esite" element={<DashboardPlaceholder />} />
                  <Route path="seller/eshop-connect" element={<DashboardPlaceholder />} />

                  {/* Admin redirect */}
                  <Route path="admin" element={<Navigate to="/manage" replace />} />

                  {/* Catch-all inside dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                {/* Legacy redirects — studio & ada now live under /dashboard */}
                <Route path="/studio" element={<Navigate to="/dashboard/studio" replace />} />
                <Route path="/studio/image-ads" element={<Navigate to="/dashboard/studio/image-ads" replace />} />
                <Route path="/ada-ai" element={<Navigate to="/dashboard/ada" replace />} />

                {/* Public ADA landing page */}
                <Route path="/ada" element={<AdaLanding />} />
                
                {/* Admin management panel */}
                <Route
                  path="/manage"
                  element={
                    <AdminRoute>
                      <AdminShell />
                    </AdminRoute>
                  }
                >
                  <Route index element={<ManageDashboard />} />
                  <Route path="ada" element={<ManageAda />} />
                  <Route path="messages" element={<ManageMessages />} />
                  {/* Platform */}
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="team" element={<ManageTeam />} />
                  <Route path="pricing" element={<ManagePricing />} />
                  <Route path="promos" element={<ManagePromos />} />
                  <Route path="surfaces" element={<ManageSurfaces />} />
                  <Route path="navigation" element={<ManageNavigation />} />
                  <Route path="community" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageCommunity /></ManageRoleGate>} />
                  <Route path="agents" element={<ManagePlaceholder />} />
                  <Route path="domains" element={<ManagePlaceholder />} />
                  {/* Analytics */}
                  <Route path="analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManagePlaceholder /></ManageRoleGate>} />
                  {/* Content */}
                  <Route path="content" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageContentHome /></ManageRoleGate>} />
                  <Route path="content/blog" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageBlog /></ManageRoleGate>} />
                  <Route path="content/news" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageNews /></ManageRoleGate>} />
                  <Route path="content/events" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageEvents /></ManageRoleGate>} />
                  {/* Design & Pages */}
                  <Route path="branding" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePlaceholder /></ManageRoleGate>} />
                  <Route path="pages" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePlaceholder /></ManageRoleGate>} />
                  {/* Operations */}
                  <Route path="integrations" element={<ManagePlaceholder />} />
                  <Route path="research-testing" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManagePlaceholder /></ManageRoleGate>} />
                  <Route path="alerts-security" element={<ManagePlaceholder />} />
                  <Route path="app-review" element={<ManageAppReview />} />
                  {/* System */}
                  <Route path="settings" element={<ManagePlaceholder />} />
                  <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManagePlaceholder /></ManageRoleGate>} />
                  <Route path="*" element={<ManageNotFound />} />
                </Route>
                
                {/* Dev routes - only in development */}
                <Route path="/dev/seed" element={<DevSeed />} />
                <Route path="/dev/test-domain-verification" element={<TestDomainVerification />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </DomainGate>
            </PublicRouteResolver>
          </DomainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
