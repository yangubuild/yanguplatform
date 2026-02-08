import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "./MassSidebar";
import { MassHeader } from "./MassHeader";
import { MassHero } from "./MassHero";
import { MassSearchBar } from "./MassSearchBar";
import { MassResourceSection } from "./MassResourceSection";
import {
  featuredResources,
  learnResources,
  buildResources,
  scaleResources,
} from "./resourceData";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1a] via-[#0f2922] to-[#0a1f1a]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1a1a1a] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[220px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          <MassHeader />
          <MassHero />
          <MassSearchBar />
          
          <MassResourceSection title="Featured" resources={featuredResources} />
          <MassResourceSection title="Learn" resources={learnResources} />
          <MassResourceSection title="Build" resources={buildResources} />
          <MassResourceSection title="Scale" resources={scaleResources} />
        </div>
      </main>
    </div>
  );
}
