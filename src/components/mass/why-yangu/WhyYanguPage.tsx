import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "../MassSidebar";
import { MassHeader } from "../MassHeader";
import { WhyYanguSidebar } from "./WhyYanguSidebar";
import { WhyYanguContent } from "./WhyYanguContent";
import { WhyYanguDevelopersContent } from "./WhyYanguDevelopersContent";
import { AudienceToggle, type Audience } from "./AudienceToggle";
import { PageShell, PageContent } from "@/components/primitives/PageShell";
import yanguYIcon from "@/assets/yangu-y-icon.png";

export function WhyYanguPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>("builders");

  return (
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen">
        <PageShell>
          <PageContent>
            <MassHeader />

            {/* Audience toggle */}
            <div className="flex items-center gap-3 mt-6">
              <AudienceToggle value={audience} onChange={setAudience} />
            </div>

            {/* Page layout: sidebar + content */}
            <div className="flex gap-8 mt-6">
              {/* Left sidebar nav */}
              <div className="hidden md:block w-[220px] flex-shrink-0">
                <WhyYanguSidebar audience={audience} />
              </div>

              {/* Right content area */}
              <div className="flex-1 min-w-0">
                {audience === "builders" ? <WhyYanguContent /> : <WhyYanguDevelopersContent />}
              </div>
            </div>
          </PageContent>
        </PageShell>

        {/* Footer */}
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
