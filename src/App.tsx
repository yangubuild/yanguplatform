import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { DomainProvider } from "@/contexts/DomainContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DomainGate } from "@/components/domain/DomainGate";
import { PublicRouteResolver } from "@/components/routing";
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
import Studio from "./pages/Studio";
import Community from "./pages/Community";
import AdaAi from "./pages/AdaAi";
import WhyYangu from "./pages/WhyYangu";
import DiscoverYangu from "./pages/DiscoverYangu";
import NavigationDashboard from "./pages/NavigationDashboard";
import Blog from "./pages/Blog";

console.log("[Supabase]", import.meta.env.VITE_SUPABASE_URL);

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
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/community" element={<Community />} />
                <Route path="/ada-ai" element={<AdaAi />} />
                <Route path="/why-yangu" element={<WhyYangu />} />
                <Route path="/discover" element={<DiscoverYangu />} />
                <Route path="/navigation" element={<NavigationDashboard />} />
                <Route path="/blog" element={<Blog />} />
                
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
                
                {/* Protected routes - require auth and completed onboarding */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Surface Editor - protected */}
                <Route
                  path="/surfaces/:id/edit"
                  element={
                    <ProtectedRoute>
                      <SurfaceEditor />
                    </ProtectedRoute>
                  }
                />
                
                {/* KYC - protected */}
                <Route
                  path="/kyc"
                  element={
                    <ProtectedRoute>
                      <KYC />
                    </ProtectedRoute>
                  }
                />
                
                {/* Billing - protected */}
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <Billing />
                    </ProtectedRoute>
                  }
                />
                
                {/* Studio - Global AI creative engine (no KYC, no subscription, no publish) */}
                <Route
                  path="/studio"
                  element={
                    <ProtectedRoute>
                      <Studio />
                    </ProtectedRoute>
                  }
                />
                
                {/* Dev routes - only in development */}
                <Route path="/dev/seed" element={<DevSeed />} />
                <Route path="/dev/test-domain-verification" element={<TestDomainVerification />} />
                
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </DomainGate>
            </PublicRouteResolver>
          </DomainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
