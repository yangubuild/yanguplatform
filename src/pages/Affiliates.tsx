import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { AffiliateDashboardView } from "@/components/affiliates/AffiliateDashboardView";
import { useAuth } from "@/hooks/useAuth";

export default function Affiliates() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-foreground lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader hideTrends />
          <div className="mt-6">
            <AffiliateDashboardView
              isAuthenticated={isAuthenticated}
              onSwitchToCreator={() => {}}
              isLandingPage
            />
          </div>
        </div>
      </main>
    </div>
  );
}
