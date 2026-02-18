import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "../MassSidebar";
import { MassHeader } from "../MassHeader";
import { AdaContentSections } from "./AdaContentSections";
import { AdaMainPanel } from "./AdaMainPanel";

export function LandingAdaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07",
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-6 left-4 z-30 p-2 rounded-lg text-white/60 hover:text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[240px]">
        <div className="px-6 pt-6">
          <MassHeader hideTrends />
        </div>

        {/* ADA main panel (public, no auth required) */}
        <AdaMainPanel hideBottomSection />

        {/* Content sections below */}
        <AdaContentSections />
      </div>
    </div>
  );
}
