import { useState } from "react";
import { Menu } from "lucide-react";
import { AdaContentSections } from "./AdaContentSections";
import { AdaMainPanel } from "./AdaMainPanel";
import { SurfaceProvider } from "@/contexts/SurfaceContext";
import { MassSidebar } from "../MassSidebar";
import { MassHeader } from "../MassHeader";

export function LandingAdaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SurfaceProvider>
      <div
        className="min-h-screen relative"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-[240px] min-h-screen">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
            <MassHeader hideTrends />
          </div>

          {/* ADA main panel (public landing — no top controls) */}
          <AdaMainPanel hideBottomSection isLanding />

          {/* Content sections below */}
          <AdaContentSections />
        </main>
      </div>
    </SurfaceProvider>
  );
}
