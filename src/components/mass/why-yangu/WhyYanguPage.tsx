import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { MassSidebar } from "../MassSidebar";
import { MassHeader } from "../MassHeader";
import { WhyYanguSidebar } from "./WhyYanguSidebar";
import { WhyYanguContent } from "./WhyYanguContent";
import { WhyYanguDevelopersContent } from "./WhyYanguDevelopersContent";
import { AudienceToggle, type Audience } from "./AudienceToggle";
import { LegalFooter } from "@/components/LegalFooter";

const STORAGE_KEY = "yangu-docs-audience";

function getInitialAudience(searchParams: URLSearchParams): Audience {
  const qp = searchParams.get("audience");
  if (qp === "builders" || qp === "developers") return qp;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "builders" || stored === "developers") return stored as Audience;
  return "developers";
}

export function WhyYanguPage() {
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>(() => getInitialAudience(searchParams));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, audience);
  }, [audience]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-foreground lg:hidden">
        <Menu className="w-6 h-6" />
      </button>

      {/* Main Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader hideTrends />

            <div className="max-w-[960px] mx-auto">
            {/* Audience toggle — right-aligned */}
            <div className="flex items-center justify-end mt-6">
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
          </div>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
