import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { LegalFooter } from "@/components/LegalFooter";

export default function AiSafety() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#08120D' }}>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen flex flex-col">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8 flex-1 w-full">
          <MassHeader hideTrends />

          <div className="max-w-3xl mt-12">
            <h1 className="text-3xl font-bold mb-8" style={{ color: '#FFFFFF', fontFamily: "'Lufga', sans-serif" }}>
              AI Safety — Yangu
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              Content coming soon.
            </p>
          </div>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
