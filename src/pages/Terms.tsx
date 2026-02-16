import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import yanguYIcon from "@/assets/yangu-y-icon.png";

export default function Terms() {
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
          <MassHeader />

          <div className="max-w-3xl mt-12">
            <h1 className="text-3xl font-bold mb-8" style={{ color: '#FFFFFF', fontFamily: "'Lufga', sans-serif" }}>
              Terms of Service — yangu
            </h1>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. Platform Usage</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu provides creator, agency, and community tools designed to help you build and manage your digital presence.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. Accounts</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Users must provide accurate information when creating an account and are responsible for maintaining the security of their account credentials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. Content Responsibility</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Users are responsible for all content they publish on the platform. You retain ownership of your content but grant yangu a license to display it within the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. Availability</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Features and services may evolve as the platform grows. We strive to maintain availability but do not guarantee uninterrupted access.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. Contact</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                For questions about these terms, contact us at{" "}
                <a href="mailto:admin@yangu.io" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>
                  admin@yangu.io
                </a>.
              </p>
            </section>
          </div>
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <span>©</span>
            <img src={yanguYIcon} alt="yangu" className="w-4 h-4 opacity-50" />
            <span>yangu 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
