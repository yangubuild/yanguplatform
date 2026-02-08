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
      className="min-h-screen"
      style={{
        background: '#08120D',
      }}
    >
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
