import { lazy, Suspense } from "react";
import { lazyRetry } from "@/lib/lazyRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { EmojiProvider } from "@/contexts/EmojiContext";
import { DomainProvider } from "@/contexts/DomainContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DomainGate } from "@/components/domain/DomainGate";
import { PublicRouteResolver } from "@/components/routing";
import { ConsoleAuthGuard } from "@/components/developers/ConsoleAuthGuard";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { DeveloperPortalGuard } from "@/components/developers/DeveloperPortalGuard";
import { resolveAppMode } from "@/lib/routing/appMode";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
const Login = lazy(() => lazyRetry(() => import("./pages/auth/Login")));
const Signup = lazy(() => lazyRetry(() => import("./pages/auth/Signup")));
const VerifyEmail = lazy(() => lazyRetry(() => import("./pages/auth/VerifyEmail")));
const ResetPassword = lazy(() => lazyRetry(() => import("./pages/auth/ResetPassword")));
const UpdatePassword = lazy(() => lazyRetry(() => import("./pages/auth/UpdatePassword")));
const AuthCallback = lazy(() => lazyRetry(() => import("./pages/auth/AuthCallback")));
const Onboarding = lazy(() => lazyRetry(() => import("./pages/Onboarding")));
const Dashboard = lazy(() => lazyRetry(() => import("./pages/Dashboard")));
const SurfacePreview = lazy(() => lazyRetry(() => import("./pages/SurfacePreview")));
const PublicSurfacePage = lazy(() => lazyRetry(() => import("./pages/PublicSurfacePage")));
const SurfaceEditor = lazy(() => lazyRetry(() => import("./pages/SurfaceEditor")));
const KYC = lazy(() => lazyRetry(() => import("./pages/KYC")));
const Billing = lazy(() => lazyRetry(() => import("./pages/Billing")));
const DevSeed = lazy(() => lazyRetry(() => import("./pages/dev/DevSeed")));
const TestDomainVerification = lazy(() => lazyRetry(() => import("./pages/dev/TestDomainVerification")));
const AgencyLandingDev = lazy(() => lazyRetry(() => import("./pages/auth/AgencyLanding")));
const AgencyLoginDev = lazy(() => lazyRetry(() => import("./pages/auth/AgencyLogin")));
const Subscriptions = lazy(() => lazyRetry(() => import("./pages/Subscriptions")));
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell } from "@/components/manage/AdminShell";
import { RolesProvider } from "@/hooks/useRoles";
import { ManageRoleGate } from "@/components/manage/ManageRoleGate";
import { RequireRole } from "@/components/auth/RequireRole";

// Studio tools — lazy-loaded so they don't bloat the initial bundle
const Studio = lazy(() => lazyRetry(() => import("./pages/Studio")));
const ImageAdsFlow = lazy(() => lazyRetry(() => import("./components/studio/image-ads/ImageAdsFlow")));
const AdClonePage = lazy(() => lazyRetry(() => import("./components/studio/ad-clone/AdClonePage")));
const CreateAvatarPage = lazy(() => lazyRetry(() => import("./components/studio/avatars/CreateAvatarPage")));
const VideoEditorPage = lazy(() => lazyRetry(() => import("./components/studio/video-editor/VideoEditorPage")));
const ProductVideoPage = lazy(() => lazyRetry(() => import("./components/studio/product-video/ProductVideoPage")));
const AiShortsPage = lazy(() => lazyRetry(() => import("./components/studio/ai-shorts/AiShortsPage")));
const StudioAssetGallery = lazy(() => lazyRetry(() => import("./components/studio/assets/StudioAssetGallery")));
const PortfolioPage = lazy(() => lazyRetry(() => import("./pages/PortfolioPage")));
const BuilderEditor = lazy(() => lazyRetry(() => import("./pages/BuilderEditor")));
const Community = lazy(() => lazyRetry(() => import("./pages/Community")));
const AdaAi = lazy(() => lazyRetry(() => import("./pages/AdaAi")));
const WhyYangu = lazy(() => lazyRetry(() => import("./pages/WhyYangu")));
const DiscoverYangu = lazy(() => lazyRetry(() => import("./pages/DiscoverYangu")));
const Blog = lazy(() => lazyRetry(() => import("./pages/Blog")));
const Privacy = lazy(() => lazyRetry(() => import("./pages/Privacy")));
const Terms = lazy(() => lazyRetry(() => import("./pages/Terms")));
const TermsOfService = lazy(() => lazyRetry(() => import("./pages/TermsOfService")));
const PrivacyPolicy = lazy(() => lazyRetry(() => import("./pages/PrivacyPolicy")));
const AiSafety = lazy(() => lazyRetry(() => import("./pages/AiSafety")));
const AdaLanding = lazy(() => lazyRetry(() => import("./pages/AdaLanding")));
const Affiliates = lazy(() => lazyRetry(() => import("./pages/Affiliates")));
const DashboardCommunityPage = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardCommunityPage")));
const InvoicesPage = lazy(() => lazyRetry(() => import("./pages/dashboard/invoices/InvoicesPage")));
const EmailPreviewPage = lazy(() => lazyRetry(() => import("./pages/dashboard/EmailPreviewPage")));

const BuilderPage = lazy(() => lazyRetry(() => import("./pages/BuilderPage")));
const SupportPage = lazy(() => lazyRetry(() => import("./pages/SupportPage")));
const HelpCenter = lazy(() => lazyRetry(() => import("./pages/HelpCenter")));
const PlatformUpdates = lazy(() => lazyRetry(() => import("./pages/PlatformUpdates")));

// Visionaire pages (lazy)
const VisionaireHome = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/VisionaireHome")));
const SavedProducts = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/SavedProducts")));
const ProductRequests = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/ProductRequests")));
const DigitalProductUniversity = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/DigitalProductUniversity")));
const UniversityCourseDetail = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/UniversityCourseDetail")));
const UniversityLessonViewer = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/UniversityLessonViewer")));
const EvergreenProblems = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/EvergreenProblems")));
const EvergreenProblemDetail = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/EvergreenProblemDetail")));
const ProductMockups = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/ProductMockups")));
const BookCoverTemplates = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/BookCoverTemplates")));
const SpecialDeals = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/SpecialDeals")));
const ProductDescriptions = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/ProductDescriptions")));
const ProductIdeas = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/ProductIdeas")));
const BookTitleGenerator = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/BookTitleGenerator")));
const PDFRebrander = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/PDFRebrander")));
const VisionaireItemDetail = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/VisionaireItemDetail")));
const VisionaireBundles = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/VisionaireBundles")));
const VisionaireBundleDetail = lazy(() => lazyRetry(() => import("./pages/dashboard/visionaire/VisionaireBundleDetail")));

// Developer platform (lazy)
const DevelopersLayout = lazy(() => lazyRetry(() => import("./components/developers/DevelopersLayout").then(m => ({ default: m.DevelopersLayout }))));
const DevelopersHome = lazy(() => lazyRetry(() => import("./pages/developers/DevelopersHome")));
const DocsQuickstart = lazy(() => lazyRetry(() => import("./pages/developers/DocsQuickstart")));
const DocsPlaceholder = lazy(() => lazyRetry(() => import("./pages/developers/DocsPlaceholder")));
const ConsoleHome = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleHome")));
const ConsoleApps = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleApps")));
const ConsoleAppDetail = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleAppDetail")));
const ConsoleSubmissions = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleSubmissions")));
const ConsoleNewSubmission = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleNewSubmission")));
const ConsoleOverview = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleOverview")));
const ConsolePermissions = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsolePermissions")));
const ConsoleRuntime = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleRuntime")));
const ConsoleWidgets = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleWidgets")));
const ConsoleInstalls = lazy(() => lazyRetry(() => import("./pages/developers/console/ConsoleInstalls")));
const StoreBrowse = lazy(() => lazyRetry(() => import("./pages/developers/store/StoreBrowse")));
const StoreListing = lazy(() => lazyRetry(() => import("./pages/developers/store/StoreListing")));
const StoreInstall = lazy(() => lazyRetry(() => import("./pages/developers/store/StoreInstall")));
const ManageAppReview = lazy(() => lazyRetry(() => import("./pages/manage/ManageAppReview")));
const ManageEntities = lazy(() => lazyRetry(() => import("./pages/manage/ManageEntities")));
const ManageReports = lazy(() => lazyRetry(() => import("./pages/manage/ManageReports")));
const EntityDetailPage = lazy(() => lazyRetry(() => import("./pages/EntityDetailPage")));
const Unsubscribe = lazy(() => lazyRetry(() => import("./pages/Unsubscribe")));

// Developer Portal (lazy)
const PortalLayoutModule = lazy(() => lazyRetry(() => import("./components/developers/portal/PortalLayout").then(m => ({ default: m.PortalLayout }))));
const PortalOverview = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalOverview")));
const PortalApps = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalApps")));
const PortalApiKeys = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalApiKeys")));
const PortalSettings = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalSettings")));
const PortalBilling = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalBilling")));
const PortalAppDetail = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalAppDetail")));
const PortalProfile = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalProfile")));
const PortalWebhooks = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalWebhooks")));
const PortalLogs = lazy(() => lazyRetry(() => import("./pages/developers/portal/PortalLogs")));
const BuilderDocsPage = lazy(() => lazyRetry(() => import("./pages/developers/docs/builders/BuilderDocsPage")));

const ManageDashboard = lazy(() => lazyRetry(() => import("./pages/manage/ManageDashboard")));
const ManagePlaceholder = lazy(() => lazyRetry(() => import("./pages/manage/ManagePlaceholder")));
const ManageAgents = lazy(() => lazyRetry(() => import("./pages/manage/ManageAgents")));
const ManageIntegrations = lazy(() => lazyRetry(() => import("./pages/manage/ManageIntegrations")));
const ManagePages = lazy(() => lazyRetry(() => import("./pages/manage/ManagePages")));
const ManageBranding = lazy(() => lazyRetry(() => import("./pages/manage/ManageBranding")));
const ManageBanners = lazy(() => lazyRetry(() => import("./pages/manage/ManageBanners")));
const ManageResearchTesting = lazy(() => lazyRetry(() => import("./pages/manage/ManageResearchTesting")));
const ManageAnalytics = lazy(() => lazyRetry(() => import("./pages/manage/ManageAnalytics")));
const ManageExploreAnalytics = lazy(() => lazyRetry(() => import("./pages/manage/ManageExploreAnalytics")));
const ManageExploreDashboard = lazy(() => lazyRetry(() => import("./pages/manage/ManageExploreDashboard")));
const ManageAuditLogs = lazy(() => lazyRetry(() => import("./pages/manage/ManageAuditLogs")));
const ManageSettings = lazy(() => lazyRetry(() => import("./pages/manage/ManageSettings")));
const ManageNotFound = lazy(() => lazyRetry(() => import("./pages/manage/ManageNotFound")));
const ManageUsers = lazy(() => lazyRetry(() => import("./pages/manage/ManageUsers")));
const ManageSurfaces = lazy(() => lazyRetry(() => import("./pages/manage/ManageSurfaces")));
const ManageDomains = lazy(() => lazyRetry(() => import("./pages/manage/ManageDomains")));
const ManageAlertsSecurity = lazy(() => lazyRetry(() => import("./pages/manage/ManageAlertsSecurity")));
const ManageNavigation = lazy(() => lazyRetry(() => import("./pages/manage/ManageNavigation")));
const ManageCommunity = lazy(() => lazyRetry(() => import("./pages/manage/ManageCommunity")));
const ManageBlog = lazy(() => lazyRetry(() => import("./pages/manage/ManageBlog")));
const ManageAda = lazy(() => lazyRetry(() => import("./pages/manage/ManageAda")));
const ManageMessages = lazy(() => lazyRetry(() => import("./pages/manage/ManageMessages")));
const ManageSupportQueue = lazy(() => lazyRetry(() => import("./pages/manage/ManageSupportQueue")));
const ManageNews = lazy(() => lazyRetry(() => import("./pages/manage/ManageNews")));
const ManageEvents = lazy(() => lazyRetry(() => import("./pages/manage/ManageEvents")));
const ManageContentHome = lazy(() => lazyRetry(() => import("./pages/manage/ManageContentHome")));
const ManagePricing = lazy(() => lazyRetry(() => import("./pages/manage/ManagePricing")));
const ManagePromos = lazy(() => lazyRetry(() => import("./pages/manage/ManagePromos")));
const ManageTeam = lazy(() => lazyRetry(() => import("./pages/manage/ManageTeam")));

const NavigationDashboardPage = lazy(() => lazyRetry(() => import("@/components/mass/navigation").then((m) => ({ default: m.NavigationDashboardPage }))));
const DashboardHome = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardHome")));
const DashboardPlaceholder = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardPlaceholder")));
const AdsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AdsPage")));
const AppStorePage = lazy(() => lazyRetry(() => import("./pages/dashboard/AppStorePage")));
const MyAppsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/MyAppsPage")));
const ConnectedAppPage = lazy(() => lazyRetry(() => import("./pages/dashboard/ConnectedAppPage")));
const GoogleDrivePage = lazy(() => lazyRetry(() => import("./pages/dashboard/apps/GoogleDrivePage")));
const GmailPage = lazy(() => lazyRetry(() => import("./pages/dashboard/apps/GmailPage")));
const GoogleMeetPage = lazy(() => lazyRetry(() => import("./pages/dashboard/apps/GoogleMeetPage")));
const YouTubePage = lazy(() => lazyRetry(() => import("./pages/dashboard/apps/YouTubePage")));
const MyBusinessPage = lazy(() => lazyRetry(() => import("./pages/dashboard/MyBusinessPage")));
const BusinessAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/business/BusinessAnalyticsPage")));
const BusinessUsersPage = lazy(() => lazyRetry(() => import("./pages/dashboard/business/BusinessUsersPage")));
const BusinessDepositPage = lazy(() => lazyRetry(() => import("./pages/dashboard/business/BusinessDepositPage")));
const InfluencerPage = lazy(() => lazyRetry(() => import("./pages/dashboard/InfluencerPage")));
const SellerSurfacePage = lazy(() => lazyRetry(() => import("./pages/dashboard/SellerSurfacePage")));
const EshopConnectPage = lazy(() => lazyRetry(() => import("./pages/seller/eshop-connect/EshopConnectPage")));
const DashboardOffers = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardOffers")));
const CustomProductWizard = lazy(() => lazyRetry(() => import("./pages/dashboard/CustomProductWizard")));
const DashboardExplore = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardExplore")));
const LiveSellingPage = lazy(() => lazyRetry(() => import("./pages/dashboard/LiveSellingPage")));
const StudioShowcasePage = lazy(() => lazyRetry(() => import("./pages/dashboard/StudioShowcasePage")));
// DashboardModuleLayout removed — routes are flat under /dashboard/*
const ProfilePage = lazy(() => lazyRetry(() => import("./pages/dashboard/ProfilePage")));
const EditProfilePage = lazy(() => lazyRetry(() => import("./pages/dashboard/EditProfilePage")));
const SubscriptionPage = lazy(() => lazyRetry(() => import("./pages/dashboard/SubscriptionPage")));
const DashboardBilling = lazy(() => lazyRetry(() => import("./pages/dashboard/DashboardBilling")));
const PromoCodesPage = lazy(() => lazyRetry(() => import("./pages/dashboard/PromoCodesPage")));
const AffiliatesPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AffiliatesPage")));
const AgencyLayout = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencyLayout")));
const AgencyHomePage = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencyHomePage")));
const AgencyAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencyAnalyticsPage")));
const AgencyMembersPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencyMembersPage")));
const AgencyPricingPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencyPricingPage")));
const AgencySupportPage = lazy(() => lazyRetry(() => import("./pages/dashboard/AgencySupportPage")));
const MessagesPage = lazy(() => lazyRetry(() => import("./pages/dashboard/MessagesPage")));
const EmenuOrdersPage = lazy(() => lazyRetry(() => import("./pages/dashboard/EmenuOrdersPage")));
const PaymentsSettingsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/PaymentsSettingsPage")));
const SettingsPage = lazy(() => lazyRetry(() => import("./pages/dashboard/SettingsPage")));
const EshopCheckoutPage = lazy(() => lazyRetry(() => import("./pages/EshopCheckoutPage")));
import { DashboardRoleGate } from "@/components/auth/DashboardRoleGate";

// Supabase client auto-configured via environment

/**
 * Host-based routing: resolveAppMode reads window.location.hostname
 * and maps it to a platform mode (platform, community, studio, etc.).
 * All domains render through the same SPA — no subdomain early-returns.
 */

/**
 * App component - contains all providers EXCEPT QueryClientProvider
 * QueryClientProvider is in main.tsx to ensure it wraps the entire app
 */
const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <RolesProvider>
      <EmojiProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DomainProvider>
            <PublicRouteResolver>
              <DomainGate>
              <RouteErrorBoundary>
              <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/" element={<Index />} />
                <Route path="/community/*" element={<Community />} />
                <Route path="/why-yangu" element={<WhyYangu />} />
                <Route path="/discover" element={<DiscoverYangu />} />
                <Route path="/discover-yangu" element={<DiscoverYangu />} />
                <Route path="/discover/:slug" element={<EntityDetailPage />} />
                {/* Typed public detail routes */}
                <Route path="/business/:slug" element={<EntityDetailPage />} />
                <Route path="/creator/:slug" element={<EntityDetailPage />} />
                <Route path="/community/:slug" element={<EntityDetailPage />} />
                <Route path="/org/:slug" element={<EntityDetailPage />} />
                <Route path="/service/:slug" element={<EntityDetailPage />} />
                <Route path="/product/:slug" element={<EntityDetailPage />} />
                <Route path="/project/:slug" element={<EntityDetailPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/affiliates" element={<Affiliates />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/termsofservice" element={<TermsOfService />} />
                <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                <Route path="/aisafety" element={<AiSafety />} />
                
                <Route path="/builder" element={<BuilderPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/updates" element={<PlatformUpdates />} />

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
                  }>
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
                <Route path="/portfolio/:slug" element={<PortfolioPage />} />
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

                {/* KYC - required before publishing */}
                <Route
                  path="/kyc"
                  element={
                    <ProtectedRoute>
                      <KYC />
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
                  }>
                  <Route index element={<Navigate to="/dashboard/offers" replace />} />
                  <Route path="home" element={<DashboardHome />} />
                  <Route path="explore" element={<DashboardExplore />} />
                  <Route path="offers" element={<DashboardOffers />} />
                  <Route path="offers/custom-product" element={<CustomProductWizard />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="ada" element={<AdaAi />} />
                  <Route path="studio" element={<Studio />} />
                  <Route path="studio/image-ads" element={<ImageAdsFlow />} />
                  <Route path="studio/ad-clone" element={<AdClonePage />} />
                  <Route path="studio/avatars/create" element={<CreateAvatarPage />} />
                  <Route path="studio/product-video" element={<ProductVideoPage />} />
                  <Route path="studio/ai-shorts" element={<AiShortsPage />} />
                  <Route path="studio/assets" element={<StudioAssetGallery />} />
                  {/* video-editor is mounted as standalone full-screen route below */}
                  <Route path="influencer" element={<InfluencerPage />} />
                  <Route path="visionaire" element={<VisionaireHome />} />
                  <Route path="visionaire/saved" element={<SavedProducts />} />
                  <Route path="visionaire/requests" element={<ProductRequests />} />
                  <Route path="visionaire/university" element={<DigitalProductUniversity />} />
                  <Route path="visionaire/university/:slug" element={<UniversityCourseDetail />} />
                  <Route path="visionaire/university/:slug/course/:courseSlug" element={<UniversityLessonViewer />} />
                  <Route path="visionaire/university/:slug/course/:courseSlug/lesson/:courseLessonIndex" element={<UniversityLessonViewer />} />
                  <Route path="visionaire/university/:slug/lessons/:lessonIndex" element={<UniversityLessonViewer />} />
                  <Route path="visionaire/evergreen" element={<EvergreenProblems />} />
                  <Route path="visionaire/evergreen/:slug" element={<EvergreenProblemDetail />} />
                  <Route path="visionaire/mockups" element={<ProductMockups />} />
                  <Route path="visionaire/book-covers" element={<BookCoverTemplates />} />
                  <Route path="visionaire/deals" element={<SpecialDeals />} />
                  <Route path="visionaire/tools/product-descriptions" element={<ProductDescriptions />} />
                  <Route path="visionaire/tools/product-ideas" element={<ProductIdeas />} />
                  <Route path="visionaire/tools/book-title-generator" element={<BookTitleGenerator />} />
                  <Route path="visionaire/tools/pdf-rebrander" element={<PDFRebrander />} />
                  <Route path="visionaire/item/:id" element={<VisionaireItemDetail />} />
                  <Route path="visionaire/bundles" element={<VisionaireBundles />} />
                  <Route path="visionaire/bundle/:id" element={<VisionaireBundleDetail />} />
                  <Route path="app-store" element={<AppStorePage />} />
                  <Route path="community" element={<DashboardCommunityPage />} />
                  <Route path="live-selling" element={<LiveSellingPage />} />
                  <Route path="studio-showcase" element={<StudioShowcasePage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile/edit" element={<EditProfilePage />} />
                  <Route path="profile/subscription" element={<SubscriptionPage />} />

                  {/* Dashboard module pages (flat, no nesting) */}
                  <Route path="my-apps" element={<MyAppsPage />} />
                  <Route path="apps/google-drive" element={<GoogleDrivePage />} />
                  <Route path="apps/gmail" element={<GmailPage />} />
                  <Route path="apps/google-meet" element={<GoogleMeetPage />} />
                  <Route path="apps/youtube" element={<YouTubePage />} />
                  <Route path="apps/:appSlug" element={<ConnectedAppPage />} />
                  <Route path="my-business" element={<MyBusinessPage />} />
                  <Route path="my-business/:businessId/analytics" element={<BusinessAnalyticsPage />} />
                  <Route path="my-business/:businessId/users" element={<BusinessUsersPage />} />
                  <Route path="my-business/:businessId/deposit" element={<BusinessDepositPage />} />
                  <Route path="payment-settings" element={<PaymentsSettingsPage />} />
                  <Route path="payments" element={<Navigate to="/dashboard/payment-settings" replace />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="email-preview" element={<EmailPreviewPage />} />
                  <Route path="ads" element={<AdsPage />} />
                  <Route path="promo-codes" element={<PromoCodesPage />} />
                  <Route path="affiliates" element={<AffiliatesPage />} />
                  <Route path="billing" element={<DashboardBilling />} />

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
                  <Route path="seller/eshop" element={<SellerSurfacePage sellerKey="eshop" />} />
                  <Route path="seller/estore" element={<SellerSurfacePage sellerKey="estore" />} />
                  <Route path="seller/emenu" element={<SellerSurfacePage sellerKey="emenu" />} />
                  <Route path="seller/esite" element={<SellerSurfacePage sellerKey="esite" />} />
                  <Route path="seller/emenu/orders" element={<EmenuOrdersPage />} />
                  <Route path="seller/eshop-connect" element={<EshopConnectPage />} />

                  {/* Admin redirect */}
                  <Route path="admin" element={<Navigate to="/manage" replace />} />

                  {/* Catch-all inside dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                {/* Full-screen Video Editor (outside dashboard shell) */}
                <Route
                  path="/dashboard/studio/video-editor"
                  element={
                    <ProtectedRoute>
                      <VideoEditorPage />
                    </ProtectedRoute>
                  }
                />

                {/* Builder Editor (full-screen, outside dashboard shell) */}
                <Route
                  path="/builder/:surfaceId"
                  element={
                    <ProtectedRoute>
                      <BuilderEditor />
                    </ProtectedRoute>
                  }
                />

                {/* Public checkout */}
                <Route path="/checkout" element={<EshopCheckoutPage />} />

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
                  }>
                  <Route index element={<ManageDashboard />} />
                  <Route path="ada" element={<ManageAda />} />
                  <Route path="messages" element={<ManageMessages />} />
                  <Route path="support" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSupportQueue /></ManageRoleGate>} />
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
                  <Route path="explore-analytics" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageExploreAnalytics /></ManageRoleGate>} />
                  <Route path="explore-dashboard" element={<ManageRoleGate allowedRoles={["admin"]}><ManageExploreDashboard /></ManageRoleGate>} />
                  {/* Content */}
                  <Route path="content" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageContentHome /></ManageRoleGate>} />
                  <Route path="content/blog" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageBlog /></ManageRoleGate>} />
                  <Route path="content/news" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageNews /></ManageRoleGate>} />
                  <Route path="content/events" element={<ManageRoleGate allowedRoles={["admin", "writer", "content_editor"]}><ManageEvents /></ManageRoleGate>} />
                  {/* Design & Pages */}
                  <Route path="branding" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManageBranding /></ManageRoleGate>} />
                  <Route path="banners" element={<ManageRoleGate allowedRoles={["admin", "content_editor"]}><ManageBanners /></ManageRoleGate>} />
                  <Route path="pages" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManagePages /></ManageRoleGate>} />
                  {/* Operations */}
                  <Route path="integrations" element={<ManageRoleGate allowedRoles={["admin"]}><ManageIntegrations /></ManageRoleGate>} />
                  <Route path="research-testing" element={<ManageRoleGate allowedRoles={["admin", "analyst"]}><ManageResearchTesting /></ManageRoleGate>} />
                  <Route path="alerts-security" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAlertsSecurity /></ManageRoleGate>} />
                  <Route path="app-review" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAppReview /></ManageRoleGate>} />
                  <Route path="entities" element={<ManageRoleGate allowedRoles={["admin"]}><ManageEntities /></ManageRoleGate>} />
                  <Route path="reports" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageReports /></ManageRoleGate>} />
                  {/* System */}
                  <Route path="settings" element={<ManageSettings />} />
                  <Route path="audit-logs" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageAuditLogs /></ManageRoleGate>} />
                  <Route path="kyc" element={<ManageRoleGate allowedRoles={["admin"]}><ManageKyc /></ManageRoleGate>} />
                  <Route path="payments" element={<ManageRoleGate allowedRoles={["admin", "finance_lead"]}><ManagePayments /></ManageRoleGate>} />
                  <Route path="ai-usage" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAiUsage /></ManageRoleGate>} />
                  <Route path="incidents" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManageIncidents /></ManageRoleGate>} />
                  <Route path="command-center" element={<ManageRoleGate allowedRoles={["admin"]}><ManageCommandCenter /></ManageRoleGate>} />
                  <Route path="media" element={<ManageRoleGate allowedRoles={["admin"]}><ManageMedia /></ManageRoleGate>} />
                  <Route path="notifications" element={<ManageRoleGate allowedRoles={["admin"]}><ManageNotifications /></ManageRoleGate>} />
                  <Route path="automation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAutomation /></ManageRoleGate>} />
                  <Route path="search" element={<ManageRoleGate allowedRoles={["admin", "moderator"]}><ManageSearch /></ManageRoleGate>} />
                  <Route path="agencies" element={<ManageRoleGate allowedRoles={["admin"]}><ManageAgencies /></ManageRoleGate>} />
                  <Route path="smart-alerts" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSmartAlerts /></ManageRoleGate>} />
                  <Route path="data-integrity" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDataIntegrity /></ManageRoleGate>} />
                  <Route path="platform-health" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManagePlatformHealth /></ManageRoleGate>} />
                  <Route path="launch-counter" element={<ManageRoleGate allowedRoles={["admin"]}><ManageLaunchCounter /></ManageRoleGate>} />
                  <Route path="engineer" element={<ManageRoleGate allowedRoles={["admin", "engineer"]}><ManageEngineer /></ManageRoleGate>} />
                  <Route path="design-studio" element={<ManageRoleGate allowedRoles={["admin", "designer"]}><ManageDesignStudio /></ManageRoleGate>} />
                  <Route path="digital-marketing" element={<ManageRoleGate allowedRoles={["admin", "social_digital"]}><ManageDigitalMarketing /></ManageRoleGate>} />
                  <Route path="department-reports" element={<ManageRoleGate allowedRoles={["admin"]}><ManageDepartmentReports /></ManageRoleGate>} />
                  <Route path="sales-marketing" element={<ManageRoleGate allowedRoles={["admin", "sales_marketing"]}><ManageSalesMarketing /></ManageRoleGate>} />
                  <Route path="management-kyc" element={<ManageRoleGate allowedRoles={["admin", "owner"]}><ManageManagementKyc /></ManageRoleGate>} />
                  <Route path="ai-visibility" element={<ManageRoleGate allowedRoles={["admin", "sales_marketing", "social_digital"]}><ManageAiVisibility /></ManageRoleGate>} />
                  <Route path="ai-visibility/competitors" element={<ManageRoleGate allowedRoles={["admin", "sales_marketing"]}><ManageAiVisibilityCompetitors /></ManageRoleGate>} />
                  <Route path="ai-visibility/content-gaps" element={<ManageRoleGate allowedRoles={["admin", "sales_marketing"]}><ManageAiVisibilityContentGaps /></ManageRoleGate>} />
                  <Route path="surface-moderation" element={<ManageRoleGate allowedRoles={["admin"]}><ManageSurfaceModeration /></ManageRoleGate>} />
                  <Route path="*" element={<ManageNotFound />} />
                </Route>
                
                {/* Dev routes - only in development */}
                <Route path="/dev/seed" element={<DevSeed />} />
                <Route path="/dev/test-domain-verification" element={<TestDomainVerification />} />
                <Route path="/dev/agency-landing" element={<Suspense fallback={<div />}><AgencyLandingDev /></Suspense>} />
                <Route path="/dev/agency-login" element={<Suspense fallback={<div />}><AgencyLoginDev /></Suspense>} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </RouteErrorBoundary>
              </DomainGate>
            </PublicRouteResolver>
          </DomainProvider>
        </BrowserRouter>
      </TooltipProvider>
      </EmojiProvider>
      </RolesProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
