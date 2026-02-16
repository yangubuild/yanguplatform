import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import yanguYIcon from "@/assets/yangu-y-icon.png";

export default function Privacy() {
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
              Privacy Policy — yangu
            </h1>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. Information We Collect</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We collect account information you provide (name, email, username), data received through Google OAuth login, platform activity related to your use of yangu, and basic technical data such as browser type and IP address.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. How We Use Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Your information is used for authentication, delivering platform functionality, improving the yangu experience, and sending essential communications related to your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. Data Sharing</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We do not sell your personal data. We may share data with trusted infrastructure providers solely to operate and maintain our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. Security</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We use industry-standard safeguards to protect your data from unauthorized access, disclosure, alteration, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. Contact</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                If you have questions about this policy, contact us at{" "}
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
