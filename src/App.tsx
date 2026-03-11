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
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { DeveloperPortalGuard } from "@/components/developers/DeveloperPortalGuard";
import { resolveAppMode } from "@/lib/routing/appMode";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/auth/UpdatePassword"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SurfacePreview = lazy(() => import("./pages/SurfacePreview"));
const PublicSurfacePage = lazy(() => import("./pages/PublicSurfacePage"));
const SurfaceEditor = lazy(() => import("./pages/SurfaceEditor"));
const KYC = lazy(() => import("./pages/KYC"));
const Billing = lazy(() => import("./pages/Billing"));
const DevSeed = lazy(() => import("./pages/dev/DevSeed"));
const TestDomainVerification = lazy(() => import("./pages/dev/TestDomainVerification"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminShell } from "@/components/manage/AdminShell";
import { ManageRoleGate } from "@/components/manage/ManageRoleGate";
import { RequireRole } from "@/components/auth/RequireRole";

// Studio tools — lazy-loaded so they don't bloat the initial bundle
const Studio = lazy(() => import("./pages/Studio"));
const ImageAdsFlow = lazy(() => import("./components/studio/image-ads/ImageAdsFlow"));
const AdClonePage = lazy(() => import("./components/studio/ad-clone/AdClonePage"));
const CreateAvatarPage = lazy(() => import("./components/studio/avatars/CreateAvatarPage"));
const VideoEditorPage = lazy(() => import("./components/studio/video-editor/VideoEditorPage"));
const ProductVideoPage = lazy(() => import("./components/studio/product-video/ProductVideoPage"));
const AiShortsPage = lazy(() => import("./components/studio/ai-shorts/AiShortsPage"));
const StudioAssetGallery = lazy(() => import("./components/studio/assets/StudioAssetGallery"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const BuilderEditor = lazy(() => import("./pages/BuilderEditor"));
const Community = lazy(() => import("./pages/Community"));
const AdaAi = lazy(() => import("./pages/AdaAi"));
const WhyYangu = lazy(() => import("./pages/WhyYangu"));
const DiscoverYangu = lazy(() => import("./pages/DiscoverYangu"));
const Blog = lazy(() => import("./pages/Blog"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AiSafety = lazy(() => import("./pages/AiSafety"));
const AdaLanding = lazy(() => import("./pages/AdaLanding"));
const DashboardCommunityPage = lazy(() => import("./pages/dashboard/DashboardCommunityPage"));
const InvoicesPage = lazy(() => import("./pages/dashboard/invoices/InvoicesPage"));

// Visionaire pages (lazy)
const VisionaireHome = lazy(() => import("./pages/dashboard/visionaire/VisionaireHome"));
const SavedProducts = lazy(() => import("./pages/dashboard/visionaire/SavedProducts"));
const ProductRequests = lazy(() => import("./pages/dashboard/visionaire/ProductRequests"));
const DigitalProductUniversity = lazy(() => import("./pages/dashboard/visionaire/DigitalProductUniversity"));
const UniversityCourseDetail = lazy(() => import("./pages/dashboard/visionaire/UniversityCourseDetail"));
const UniversityLessonViewer = lazy(() => import("./pages/dashboard/visionaire/UniversityLessonViewer"));
const EvergreenProblems = lazy(() => import("./pages/dashboard/visionaire/EvergreenProblems"));
const EvergreenProblemDetail = lazy(() => import("./pages/dashboard/visionaire/EvergreenProblemDetail"));
const ProductMockups = lazy(() => import("./pages/dashboard/visionaire/ProductMockups"));
const BookCoverTemplates = lazy(() => import("./pages/dashboard/visionaire/BookCoverTemplates"));
const SpecialDeals = lazy(() => import("./pages/dashboard/visionaire/SpecialDeals"));
const ProductDescriptions = lazy(() => import("./pages/dashboard/visionaire/ProductDescriptions"));
const ProductIdeas = lazy(() => import("./pages/dashboard/visionaire/ProductIdeas"));
const BookTitleGenerator = lazy(() => import("./pages/dashboard/visionaire/BookTitleGenerator"));
const PDFRebrander = lazy(() => import("./pages/dashboard/visionaire/PDFRebrander"));
const VisionaireItemDetail = lazy(() => import("./pages/dashboard/visionaire/VisionaireItemDetail"));
const VisionaireBundles = lazy(() => import("./pages/dashboard/visionaire/VisionaireBundles"));
const VisionaireBundleDetail = lazy(() => import("./pages/dashboard/visionaire/VisionaireBundleDetail"));

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

const NavigationDashboardPage = lazy(() => import("@/components/mass/navigation").then((m) => ({ default: m.NavigationDashboardPage })));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const DashboardPlaceholder = lazy(() => import("./pages/dashboard/DashboardPlaceholder"));
const AdsPage = lazy(() => import("./pages/dashboard/AdsPage"));
const AppStorePage = lazy(() => import("./pages/dashboard/AppStorePage"));
const MyAppsPage = lazy(() => import("./pages/dashboard/MyAppsPage"));
const MyBusinessPage = lazy(() => import("./pages/dashboard/MyBusinessPage"));
const BusinessAnalyticsPage = lazy(() => import("./pages/dashboard/business/BusinessAnalyticsPage"));
const BusinessUsersPage = lazy(() => import("./pages/dashboard/business/BusinessUsersPage"));
const BusinessDepositPage = lazy(() => import("./pages/dashboard/business/BusinessDepositPage"));
const InfluencerPage = lazy(() => import("./pages/dashboard/InfluencerPage"));
const SellerSurfacePage = lazy(() => import("./pages/dashboard/SellerSurfacePage"));
const EshopConnectPage = lazy(() => import("./pages/seller/eshop-connect/EshopConnectPage"));
const DashboardOffers = lazy(() => import("./pages/dashboard/DashboardOffers"));
const CustomProductWizard = lazy(() => import("./pages/dashboard/CustomProductWizard"));
const DashboardExplore = lazy(() => import("./pages/dashboard/DashboardExplore"));
const LiveSellingPage = lazy(() => import("./pages/dashboard/LiveSellingPage"));
const StudioShowcasePage = lazy(() => import("./pages/dashboard/StudioShowcasePage"));
// DashboardModuleLayout removed — routes are flat under /dashboard/*
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/dashboard/EditProfilePage"));
const SubscriptionPage = lazy(() => import("./pages/dashboard/SubscriptionPage"));
const DashboardBilling = lazy(() => import("./pages/dashboard/DashboardBilling"));
const PromoCodesPage = lazy(() => import("./pages/dashboard/PromoCodesPage"));
const AffiliatesPage = lazy(() => import("./pages/dashboard/AffiliatesPage"));
const AgencyLayout = lazy(() => import("./pages/dashboard/AgencyLayout"));
const AgencyHomePage = lazy(() => import("./pages/dashboard/AgencyHomePage"));
const AgencyAnalyticsPage = lazy(() => import("./pages/dashboard/AgencyAnalyticsPage"));
const AgencyMembersPage = lazy(() => import("./pages/dashboard/AgencyMembersPage"));
const AgencyPricingPage = lazy(() => import("./pages/dashboard/AgencyPricingPage"));
const AgencySupportPage = lazy(() => import("./pages/dashboard/AgencySupportPage"));
const MessagesPage = lazy(() => import("./pages/dashboard/MessagesPage"));
const EmenuOrdersPage = lazy(() => import("./pages/dashboard/EmenuOrdersPage"));
const PaymentsSettingsPage = lazy(() => import("./pages/dashboard/PaymentsSettingsPage"));
const EshopCheckoutPage = lazy(() => import("./pages/EshopCheckoutPage"));
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DomainProvider>
            <PublicRouteResolver>
              <DomainGate>
              <RouteErrorBoundary>
              <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08120D" }}><img src="/yangu-y-loader.png" alt="Loading" width={40} height={40} style={{ animation: "spin 1.4s linear infinite" }} /></div>}>
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
                <Route path="/termsofservice" element={<TermsOfService />} />
                <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                <Route path="/aisafety" element={<AiSafety />} />

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
                  }
                >
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
                  <Route path="profile/edit" element={<EditProfilePage />} />
                  <Route path="profile/subscription" element={<SubscriptionPage />} />

                  {/* Dashboard module pages (flat, no nesting) */}
                  <Route path="my-apps" element={<MyAppsPage />} />
                  <Route path="my-business" element={<MyBusinessPage />} />
                  <Route path="my-business/:businessId/analytics" element={<BusinessAnalyticsPage />} />
                  <Route path="my-business/:businessId/users" element={<BusinessUsersPage />} />
                  <Route path="my-business/:businessId/deposit" element={<BusinessDepositPage />} />
                  <Route path="payment-settings" element={<PaymentsSettingsPage />} />
                  <Route path="payments" element={<Navigate to="/dashboard/payment-settings" replace />} />
                  <Route path="invoices" element={<InvoicesPage />} />
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
              </RouteErrorBoundary>
              </DomainGate>
            </PublicRouteResolver>
          </DomainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
