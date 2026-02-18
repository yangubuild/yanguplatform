import { useState } from "react";
import { Menu } from "lucide-react";
import { AdaSidebar } from "./AdaSidebar";
import { AdaMainPanel } from "./AdaMainPanel";


export function AdaAiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(212,149,43,0.10) 0%, rgba(5,10,7,0) 50%), #050A07" }}
    >
      <div className="flex flex-1 min-h-0">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 left-4 z-30 p-2 rounded-lg text-white/60 hover:text-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <AdaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} inline />
        <div className="flex-1 min-w-0 flex flex-col">
          <AdaMainPanel />
        </div>
      </div>
    </div>
  );
}
