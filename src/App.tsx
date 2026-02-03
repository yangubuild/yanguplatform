import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { DomainProvider } from "@/contexts/DomainContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DomainGate } from "@/components/domain/DomainGate";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DomainProvider>
              <DomainGate>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
              
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
              
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DomainGate>
            </DomainProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
