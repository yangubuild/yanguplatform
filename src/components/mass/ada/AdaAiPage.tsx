import { useState } from "react";
import { Menu } from "lucide-react";
import { AdaSidebar } from "./AdaSidebar";
import { AdaMainPanel } from "./AdaMainPanel";

export function AdaAiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0e0e0e" }}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg text-white/60 hover:text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AdaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdaMainPanel />
    </div>
  );
}
