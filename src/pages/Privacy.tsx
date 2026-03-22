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
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-foreground lg:hidden">
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen flex flex-col">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8 flex-1 w-full">
          <MassHeader hideTrends />

          <div className="max-w-3xl mt-12">
            <h1 className="text-3xl font-bold mb-8" style={{ color: '#FFFFFF', fontFamily: "'Lufga', sans-serif" }}>
              Privacy Policy — yangu
            </h1>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. Introduction</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu ("yangu", "we", "our", or "us") provides AI-powered creator tools, digital commerce infrastructure, community features, and platform services designed to help users build, manage, and grow their digital presence. This Privacy Policy explains how we collect, use, disclose, and protect information when you use our websites, applications, AI tools, or integrations such as Google Login and Google Drive.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                By using yangu, you agree to the practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. Information We Collect</h2>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Account Information</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                When you create an account, we may collect your name, email address, username, profile information, and authentication credentials.
              </p>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Authentication Information</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                If you choose to sign in using Google Login, we receive basic profile data such as your email address, name, and profile image as permitted by your Google account settings.
              </p>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>User Content and Platform Data</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We collect content you upload, create, or generate through yangu, including:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>AI-generated text, images, or media</li>
                <li>files uploaded through platform tools</li>
                <li>exported documents or assets</li>
                <li>community posts or listings</li>
              </ul>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Usage Data</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We collect information about how you interact with the platform, including feature usage, timestamps, navigation behavior, and system performance metrics.
              </p>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Technical Information</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may automatically collect technical information such as IP address, browser type, operating system, and device identifiers to maintain security and performance.
              </p>

              <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: 'rgba(255,255,255,0.85)' }}>Google Drive Data</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                If you connect your Google Drive account:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>yangu only accesses files that you explicitly choose to upload or export.</li>
                <li>We do not browse, scan, or access any other files within your Drive.</li>
                <li>Access is limited to functionality necessary to complete your requested action.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. AI Features and External Processing</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu integrates AI technologies to provide content generation and automation features. When you use AI tools:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>Requests may be processed by third-party AI infrastructure providers solely to deliver the output you requested.</li>
                <li>Only the minimum information required for processing is transmitted.</li>
                <li>AI providers are not permitted to use your data for advertising or independent profiling through yangu services.</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Generated outputs are created automatically and may contain inaccuracies. Users are responsible for reviewing and using generated content appropriately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. How We Use Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>provide authentication and account access</li>
                <li>operate AI tools and platform features</li>
                <li>upload files to Google Drive when initiated by the user</li>
                <li>maintain security, reliability, and performance</li>
                <li>improve platform functionality</li>
                <li>provide customer support and essential service communications</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We do not sell personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. Google API Services User Data</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu's use of information received from Google APIs complies with the Google API Services User Data Policy, including Limited Use requirements.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Specifically:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>Google user data is used only to provide user-facing functionality.</li>
                <li>Data obtained through Google APIs is not used for advertising, profiling, or resale.</li>
                <li>Access to Google Drive occurs only when you initiate an upload or export.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>6. Data Sharing</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may share limited information with trusted infrastructure providers that help operate the service, including:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>cloud hosting and storage providers</li>
                <li>AI processing infrastructure</li>
                <li>analytics and monitoring services</li>
              </ul>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                These providers only process data necessary to deliver the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>7. Data Storage and Security</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We implement industry-standard safeguards to protect information, including encrypted connections and secure server-side storage.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                OAuth access tokens and sensitive credentials are stored securely on the server and are never exposed to the client application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>8. Data Retention</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We retain data only as long as necessary to provide platform services, maintain security, comply with legal obligations, or resolve disputes.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Users may request deletion of their data at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>9. Your Rights and Controls</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                You may:
              </p>
              <ul className="list-disc pl-6 mt-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li>disconnect Google Drive access at any time</li>
                <li>delete files or content you created</li>
                <li>request account or data deletion by contacting us</li>
                <li>control profile visibility within platform settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>10. Platform Ecosystem and Subdomains</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu operates multiple platform modules and domains including creator tools, community features, and AI-powered services. Data collected across these services is processed under this unified Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>11. Children's Privacy</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                yangu is not intended for users under the age of 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>12. Changes to This Policy</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We may update this Privacy Policy from time to time. Continued use of the platform after updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>13. Contact Information</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                If you have questions or requests regarding this Privacy Policy, contact:{" "}
                <a href="mailto:admin@yangu.io" className="underline hover:opacity-80" style={{ color: '#b5622a' }}>
                  admin@yangu.io
                </a>
              </p>
            </section>
          </div>
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <span>©</span>
            <img src={yanguYIcon} alt="yangu" className="w-4 h-4 opacity-50" />
            <span>yangu 2026</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
