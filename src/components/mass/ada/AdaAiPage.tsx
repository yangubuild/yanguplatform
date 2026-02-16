import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ArrowLeft } from "lucide-react";
import { AdaSidebar } from "./AdaSidebar";
import { AdaMainPanel } from "./AdaMainPanel";
import { AdaContentSections } from "./AdaContentSections";

export function AdaAiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#050A07" }}
    >
      <div className="flex flex-1 relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg text-white/60 hover:text-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Back to dashboard button */}
        <button
          onClick={() => navigate(-1)}
          className="fixed top-4 right-16 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <AdaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <AdaMainPanel />
      </div>
      <AdaContentSections />
    </div>
  );
}
