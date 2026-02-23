import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "@/components/mass/MassSidebar";
import { MassHeader } from "@/components/mass/MassHeader";
import { LegalFooter } from "@/components/LegalFooter";

export default function TermsOfService() {
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
              Terms of Service — Yangu
            </h1>

            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              <strong style={{ color: '#FFFFFF' }}>Effective Date:</strong> February 20, 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                By accessing or using Yangu ("Yangu", "we", "our", or "us"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                These Terms constitute a legally binding agreement between you and Yangu. They govern your access to and use of all Yangu services, applications, websites, APIs, and integrations. We encourage you to read these Terms carefully before using the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. Platform Overview</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu provides AI-powered tools, creator services, digital commerce infrastructure, community features, and integrations designed to help users build and manage digital experiences.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Services may include:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>AI content generation, automation, and media creation tools (text, image, video)</li>
                <li>Creator and agency dashboards for managing digital presence</li>
                <li>Community and marketplace features for discovery and collaboration</li>
                <li>File export, storage, and cloud integrations</li>
                <li>Optional Google Login and Google Drive connectivity</li>
                <li>Digital storefront, e-commerce, and payment infrastructure</li>
                <li>Developer APIs, SDKs, and third-party app integrations</li>
                <li>Analytics, reporting, and performance tracking tools</li>
                <li>Advertising and promotional campaign management</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Features may evolve, be added, modified, or discontinued over time. We will endeavor to provide reasonable notice of significant changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. Accounts and Authentication</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>If you sign in using Google Login:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>Authentication is subject to Google's own policies and terms of service</li>
                <li>You may disconnect access at any time through your account settings</li>
                <li>Yangu receives only the profile information you authorize during the OAuth consent flow</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You must notify us immediately of any unauthorized use of your account. Yangu is not liable for losses arising from unauthorized access to your credentials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. User Content and Ownership</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You retain ownership of content you create, upload, or generate through Yangu.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                By using the platform, you grant Yangu a limited, non-exclusive license to host, process, display, and distribute your content solely for operating and improving platform services.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You are responsible for ensuring that your content complies with applicable laws and does not infringe on third-party rights, including intellectual property, privacy, and publicity rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. AI Features and Generated Content</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu integrates AI technologies to assist with content creation and automation. AI-generated content is produced using third-party machine learning models and infrastructure.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>By using AI tools:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>You acknowledge that outputs are generated automatically and may contain errors, inaccuracies, or biases</li>
                <li>You are solely responsible for reviewing, verifying, and editing AI-generated results before use or publication</li>
                <li>Yangu does not guarantee the accuracy, reliability, originality, or suitability of generated outputs</li>
                <li>AI-generated content may not be suitable for all purposes and should not be relied upon as professional, legal, medical, or financial advice</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu does not claim ownership over content you create using AI tools. However, similar outputs may be generated for other users using the same or similar prompts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>6. Google Drive Integration</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>When you choose to connect Google Drive:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>Files are uploaded only when you initiate the action</li>
                <li>Yangu does not browse or access other files within your Drive</li>
                <li>You may revoke access at any time via your Google account settings</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Use of Google services is subject to Google's Terms and policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>7. Acceptable Use</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>Upload unlawful, harmful, abusive, defamatory, or obscene content</li>
                <li>Misuse platform features, APIs, or developer tools</li>
                <li>Attempt unauthorized access to accounts, systems, or data</li>
                <li>Interfere with platform security, infrastructure, or operations</li>
                <li>Use automated scripts, bots, or crawlers in ways that disrupt service performance</li>
                <li>Engage in fraud, impersonation, or misleading practices</li>
                <li>Use the platform to distribute malware, phishing attempts, or spam</li>
                <li>Violate any applicable local, national, or international law or regulation</li>
                <li>Harvest or collect user data without proper authorization</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu reserves the right to restrict, suspend, or remove content and accounts that violate these rules, at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>8. Third-Party Integrations</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu integrates with third-party services to provide enhanced functionality. These integrations may include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>OAuth authentication providers (Google, TikTok, and others)</li>
                <li>AI infrastructure and model providers for content generation</li>
                <li>Cloud hosting and storage services</li>
                <li>Payment processing and financial services</li>
                <li>Analytics and performance monitoring tools</li>
                <li>Social media platforms for content distribution</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Your use of these third-party services through Yangu is also subject to their respective terms of service and privacy policies. Yangu is not responsible for the practices or availability of third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>9. Platform Availability</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We aim to provide reliable services but do not guarantee uninterrupted availability. Features may be modified, suspended, or discontinued at any time. Scheduled and unscheduled maintenance may temporarily affect access to the platform.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu shall not be liable for any loss or damage arising from service interruptions, delays, or downtime.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>10. Account Responsibility and Platform Risks</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>All activity conducted through your account</li>
                <li>Maintaining the security of your authentication credentials</li>
                <li>Ensuring your use of the platform complies with all applicable laws</li>
                <li>Backing up your content and data as needed</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Yangu is not responsible for losses resulting from unauthorized account access, data loss due to user error, or reliance on AI-generated content without proper review.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>11. Fees and Monetization</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Some platform features may require subscriptions or payments. Pricing and access conditions will be clearly communicated within the platform. All fees are non-refundable unless otherwise stated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>12. Termination</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may suspend or terminate accounts that violate these Terms or pose risks to platform integrity or user safety, with or without prior notice.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You may stop using Yangu at any time. Upon termination, certain provisions of these Terms shall survive, including sections related to intellectual property, limitation of liability, and dispute resolution.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>13. Limitation of Liability</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                To the maximum extent permitted by law, Yangu is provided "as is" without warranties of any kind, express or implied. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the platform, including but not limited to loss of profits, data, or business opportunities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>14. Changes to Terms</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may update these Terms periodically. Material changes will be communicated through the platform or via email. Continued use after updates constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>15. Governing Law</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                These Terms are governed by applicable laws where Yangu operates. Specific jurisdiction details may be updated as the platform expands.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>16. Contact Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                For questions regarding these Terms, please contact us at:
              </p>
              <ul className="list-none mt-3 space-y-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>
                  <strong style={{ color: '#FFFFFF' }}>Email:</strong>{" "}
                  <a href="mailto:legal@yangu.io" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>legal@yangu.io</a>
                  {" · "}
                  <a href="mailto:admin@yangu.io" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>admin@yangu.io</a>
                  {" · "}
                  <a href="mailto:info@digitalcommunity.space" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>info@digitalcommunity.space</a>
                </li>
                <li>
                  <strong style={{ color: '#FFFFFF' }}>Phone:</strong>{" "}
                  <span>+971 568 727 424</span>
                  {" · "}
                  <span>+1 680 219 7445</span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
