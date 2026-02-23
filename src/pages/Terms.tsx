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
          <MassHeader hideTrends />

          <div className="max-w-3xl mt-12">
            <h1 className="text-3xl font-bold mb-8" style={{ color: '#FFFFFF', fontFamily: "'Lufga', sans-serif" }}>
              Terms of Service — yangu
            </h1>

            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              <strong style={{ color: '#FFFFFF' }}>Effective Date:</strong> February 20, 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                By accessing or using yangu ("yangu", "we", "our", or "us"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. Platform Overview</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu provides AI-powered tools, creator services, digital commerce infrastructure, community features, and integrations designed to help users build and manage digital experiences.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Services may include:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>AI content generation and automation tools</li>
                <li>creator and agency dashboards</li>
                <li>community and marketplace features</li>
                <li>file export and storage integrations</li>
                <li>optional Google Login and Google Drive connectivity</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Features may evolve or change over time.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. Accounts and Authentication</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>If you sign in using Google Login:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>authentication is subject to Google's own policies</li>
                <li>you may disconnect access at any time through your account settings.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. User Content and Ownership</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You retain ownership of content you create, upload, or generate through yangu.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                By using the platform, you grant yangu a limited, non-exclusive license to host, process, display, and distribute your content solely for operating and improving platform services.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You are responsible for ensuring that your content complies with applicable laws and does not infringe on third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. AI Features and Generated Content</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu integrates AI technologies to assist with content creation and automation.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>By using AI tools:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>you acknowledge that outputs are generated automatically and may contain errors or inaccuracies</li>
                <li>you are responsible for reviewing and verifying AI-generated results</li>
                <li>yangu does not guarantee the accuracy, reliability, or suitability of generated outputs</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu does not claim ownership over content you create using AI tools.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>6. Google Drive Integration</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>When you choose to connect Google Drive:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>files are uploaded only when you initiate the action</li>
                <li>yangu does not browse or access other files within your Drive</li>
                <li>you may revoke access at any time via your Google account settings</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Use of Google services is subject to Google's Terms and policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>7. Acceptable Use</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>upload unlawful, harmful, or abusive content</li>
                <li>misuse platform features or APIs</li>
                <li>attempt unauthorized access to accounts or systems</li>
                <li>interfere with platform security or operations</li>
                <li>use automated scripts in ways that disrupt service performance</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu reserves the right to restrict or remove content that violates these rules.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>8. Platform Availability</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We aim to provide reliable services but do not guarantee uninterrupted availability. Features may be modified, suspended, or discontinued at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>9. Third-Party Services</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu may integrate third-party services, including AI infrastructure providers, cloud hosting platforms, analytics tools, and payment processors.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Your use of these services may also be subject to their respective terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>10. Fees and Monetization</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Some platform features may require subscriptions or payments. Pricing and access conditions will be clearly communicated within the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>11. Termination</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may suspend or terminate accounts that violate these Terms or pose risks to platform integrity or user safety.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You may stop using yangu at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>12. Limitation of Liability</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                To the maximum extent permitted by law, yangu is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from use of the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>13. Changes to Terms</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may update these Terms periodically. Continued use after updates constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>14. Governing Law</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                These Terms are governed by applicable laws where yangu operates. Specific jurisdiction details may be updated as the platform expands.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>15. Contact Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                For questions regarding these Terms:{" "}
                <a href="mailto:admin@yangu.io" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>
                  admin@yangu.io
                </a>
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
