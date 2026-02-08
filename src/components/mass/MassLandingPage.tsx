import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "./MassSidebar";
import { MassHeader } from "./MassHeader";
import { MassHero } from "./MassHero";
import { MassSearchBar } from "./MassSearchBar";
import { MassResourceSection } from "./MassResourceSection";
import { 
  featuredResources, 
  inspirationResources, 
  noCodeResources, 
  templatesResources, 
  aiResources, 
  typographyResources, 
  designToolsResources 
} from "./resourceData";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: 'linear-gradient(180deg, #15261F 0%, #0A1710 55%, #060B09 100%)',
      }}
    >
      {/* Subtle bloom overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 25% 10%, rgba(41,96,72,0.18) 0%, rgba(10,23,16,0) 55%)',
        }}
      />
      {/* Global darkening overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.15)',
        }}
      />
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader />
          <MassHero />
          <MassSearchBar />
          
          <MassResourceSection title="Featured" resources={featuredResources} />
          <MassResourceSection title="Inspiration" resources={inspirationResources} />
          <MassResourceSection title="No Code" resources={noCodeResources} />
          <MassResourceSection title="Templates" resources={templatesResources} />
          <MassResourceSection title="Ai" resources={aiResources} />
          <MassResourceSection title="Typography" resources={typographyResources} />
          <MassResourceSection title="Design Tools" resources={designToolsResources} />
        </div>
      </main>
    </div>
  );
}
