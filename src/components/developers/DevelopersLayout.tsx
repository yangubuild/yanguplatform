import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { DevelopersSidebar } from "./DevelopersSidebar";
import yanguYIcon from "@/assets/yangu-y-icon.png";

export function DevelopersLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-8">
          <MassHeader hideTrends />

          <div className="flex gap-6 mt-6">
            <div className="hidden md:block w-[200px] flex-shrink-0">
              <DevelopersSidebar />
            </div>
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <span>©</span>
            <img src={yanguYIcon} alt="Yangu" className="w-4 h-4 opacity-50" />
            <span>yangu 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
