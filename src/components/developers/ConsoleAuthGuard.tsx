import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperAuthModal } from "./DeveloperAuthModal";

/**
 * Wraps any /developers/console/* route.
 * If not authenticated, blocks UI and shows DeveloperAuthModal.
 */
export function ConsoleAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-white/50 text-sm">Sign in to access the Developer Console.</p>
        <DeveloperAuthModal
          open={showAuth}
          onClose={() => {
            setShowAuth(false);
            navigate("/developers");
          }}
          returnTo={location.pathname + location.search}
          onSuccess={() => {
            setShowAuth(false);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
