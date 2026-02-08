import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "./MassSidebar";
import { MassHeader } from "./MassHeader";
import { MassHero } from "./MassHero";
import { MassSearchBar } from "./MassSearchBar";
import { MassResourceSection } from "./MassResourceSection";
import { featuredResources } from "./resourceData";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient green glow behind hero */}
      <div 
        className="absolute top-0 left-[220px] right-0 h-[700px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 60% 30%, rgba(28, 65, 49, 0.55) 0%, rgba(0, 0, 0, 0) 70%)'
        }}
      />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-black/80 text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[220px] min-h-screen relative z-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6">
          <MassHeader />
          <MassHero />
          <MassSearchBar />
          
          <MassResourceSection title="FEATURED" resources={featuredResources} />
        </div>
      </main>
    </div>
  );
}
