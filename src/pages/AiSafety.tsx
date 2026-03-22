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
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-foreground lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen flex flex-col">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8 flex-1 w-full">
          <MassHeader hideTrends />

          <div className="max-w-3xl mt-12">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFFFF', fontFamily: "'Lufga', sans-serif" }}>
              AI Safety &amp; Ethics
            </h1>
            <p className="mb-2" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
              How We Ensure Safe and Responsible AI
            </p>
            <p className="mb-10" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              <strong style={{ color: '#FFFFFF' }}>Last Updated:</strong> February 23, 2026
            </p>

            {/* Our Commitment */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>Our Commitment to Safe AI</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                At yangu, we believe that AI should be powerful, helpful, and safe. We've implemented multiple layers of protection to ensure our AI tools benefit users while respecting privacy, security, and ethical boundaries.
              </p>
            </section>

            {/* 1. AI & Data Privacy */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>1. AI &amp; Data Privacy</h2>
              <p className="mb-3 text-sm font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>YOUR DATA, YOUR CONTROL</p>
              <ul className="list-disc pl-6 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li><strong style={{ color: '#FFFFFF' }}>Private by Default:</strong> Your conversations with AI agents are private and encrypted</li>
                <li><strong style={{ color: '#FFFFFF' }}>No Training on Your Data:</strong> We do NOT use your private data to train AI models</li>
                <li><strong style={{ color: '#FFFFFF' }}>Organization Isolation:</strong> AI interactions stay within your organization</li>
                <li><strong style={{ color: '#FFFFFF' }}>Secure Processing:</strong> All AI requests are encrypted end-to-end</li>
                <li><strong style={{ color: '#FFFFFF' }}>Data Retention:</strong> You control how long your AI conversation history is kept</li>
              </ul>
            </section>

            {/* 2. Content Safety */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>2. Content Safety &amp; Moderation</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We've implemented multiple safety measures to prevent harmful content:
              </p>
              <ul className="list-disc pl-6 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li><strong style={{ color: '#FFFFFF' }}>Automatic Filtering:</strong> AI outputs are filtered for harmful, inappropriate, or offensive content</li>
                <li><strong style={{ color: '#FFFFFF' }}>Bias Mitigation:</strong> Our AI is designed to minimize discriminatory or biased responses</li>
                <li><strong style={{ color: '#FFFFFF' }}>Fact-Checking:</strong> When possible, AI responses include sources and citations</li>
                <li><strong style={{ color: '#FFFFFF' }}>Human Oversight:</strong> Critical AI applications have human review layers</li>
                <li><strong style={{ color: '#FFFFFF' }}>User Reporting:</strong> Easy reporting tools for problematic AI responses</li>
                <li><strong style={{ color: '#FFFFFF' }}>Continuous Improvement:</strong> We regularly update AI safety protocols</li>
              </ul>
            </section>

            {/* 3. Transparency */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>3. AI Transparency &amp; Limitations</h2>
              <p className="mb-3 text-sm font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>WHAT YOU SHOULD KNOW:</p>
              <ul className="list-disc pl-6 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li><strong style={{ color: '#FFFFFF' }}>AI Can Make Mistakes:</strong> AI-generated content should be verified before important use</li>
                <li><strong style={{ color: '#FFFFFF' }}>Not Professional Advice:</strong> AI does not replace legal, medical, or financial professionals</li>
                <li><strong style={{ color: '#FFFFFF' }}>Current Information:</strong> AI knowledge has cutoff dates and may not reflect recent events</li>
                <li><strong style={{ color: '#FFFFFF' }}>Context Limitations:</strong> AI may misunderstand complex or ambiguous requests</li>
                <li><strong style={{ color: '#FFFFFF' }}>Creative Content:</strong> AI-generated images/text should be reviewed for accuracy</li>
                <li><strong style={{ color: '#FFFFFF' }}>No Autonomous Actions:</strong> Our AI cannot perform actions without user confirmation</li>
              </ul>
            </section>

            {/* 4. Ethical Principles */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>4. Ethical AI Principles</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Our AI development follows these core principles:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  <span>✅</span>
                  <div><strong style={{ color: '#FFFFFF' }}>Fairness</strong> — AI should treat all users equally without discrimination</div>
                </div>
                <div className="flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  <span>✅</span>
                  <div><strong style={{ color: '#FFFFFF' }}>Accountability</strong> — We take responsibility for our AI systems' outputs</div>
                </div>
                <div className="flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  <span>✅</span>
                  <div><strong style={{ color: '#FFFFFF' }}>Privacy</strong> — User privacy is never compromised for AI improvement</div>
                </div>
                <div className="flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  <span>✅</span>
                  <div><strong style={{ color: '#FFFFFF' }}>Transparency</strong> — Users always know when they're interacting with AI</div>
                </div>
              </div>
            </section>

            {/* 5. Your Responsibilities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>5. Your Responsibilities</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                To ensure safe AI usage, we ask that you:
              </p>
              <ul className="list-disc pl-6 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li><strong style={{ color: '#FFFFFF' }}>Verify Important Information:</strong> Double-check AI outputs for critical decisions</li>
                <li><strong style={{ color: '#FFFFFF' }}>Use Responsibly:</strong> Don't attempt to circumvent safety measures</li>
                <li><strong style={{ color: '#FFFFFF' }}>Report Issues:</strong> Alert us if AI produces harmful or incorrect content</li>
                <li><strong style={{ color: '#FFFFFF' }}>Respect Others:</strong> Don't use AI to create harmful content about others</li>
                <li><strong style={{ color: '#FFFFFF' }}>Follow Guidelines:</strong> Adhere to our Acceptable Use Policy</li>
                <li><strong style={{ color: '#FFFFFF' }}>Stay Informed:</strong> Keep up with AI capabilities and limitations</li>
              </ul>
            </section>

            {/* 6. Security Measures */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>6. AI Security Measures</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We protect our AI systems and your data through:
              </p>
              <ul className="list-disc pl-6 space-y-1" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <li><strong style={{ color: '#FFFFFF' }}>Secure Infrastructure:</strong> AI processing happens in secure, encrypted environments</li>
                <li><strong style={{ color: '#FFFFFF' }}>Access Controls:</strong> Strict authentication and authorization for AI features</li>
                <li><strong style={{ color: '#FFFFFF' }}>Monitoring:</strong> 24/7 monitoring for unusual AI usage patterns</li>
                <li><strong style={{ color: '#FFFFFF' }}>Rate Limiting:</strong> Prevention of AI abuse through usage limits</li>
                <li><strong style={{ color: '#FFFFFF' }}>Prompt Injection Protection:</strong> Defense against malicious AI prompts</li>
                <li><strong style={{ color: '#FFFFFF' }}>Regular Audits:</strong> Third-party security assessments of AI systems</li>
              </ul>
            </section>

            {/* Report Concerns */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#FFFFFF' }}>Report AI Safety Concerns</h2>
              <p className="mb-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                If you encounter AI safety issues, harmful content, or have concerns, please contact us immediately:
              </p>
              <ul className="list-none space-y-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
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
              <p className="mt-4" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We take all AI safety reports seriously and investigate them promptly.
              </p>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                We're committed to making AI safe, helpful, and beneficial for all users.
              </p>
            </section>
          </div>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
