import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, FileCheck, Users, Database, Eye } from "lucide-react";
import badgeSoc2 from "@/assets/badge-soc2.png";
import badgeGdpr from "@/assets/badge-gdpr.png";
import badgeIso from "@/assets/badge-iso27001.png";

const controls = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    desc: "Data is encrypted in transit with TLS 1.2+ and at rest with AES-256.",
  },
  {
    icon: Users,
    title: "SSO & role-based access",
    desc: "Enforce SSO across your workspace and assign granular roles per member.",
  },
  {
    icon: FileCheck,
    title: "Publishing approvals",
    desc: "Control who can publish surfaces with approval workflows.",
  },
  {
    icon: Database,
    title: "Your data, your region",
    desc: "Choose where your data lives and keep your prompts out of model training.",
  },
  {
    icon: Eye,
    title: "Audit logs",
    desc: "Track every change with detailed audit trails available to admins.",
  },
  {
    icon: Shield,
    title: "Threat detection",
    desc: "24/7 monitoring with automated anomaly and intrusion detection.",
  },
];

const governance = [
  {
    title: "Trust center",
    desc: "Single hub for security documentation, sub-processors, and certifications.",
  },
  {
    title: "Vulnerability disclosure",
    desc: "Report security issues responsibly through our coordinated disclosure program.",
  },
  {
    title: "Incident response",
    desc: "Documented playbooks with defined SLAs for detection, containment, and recovery.",
  },
  {
    title: "Data processing agreement",
    desc: "DPA available for all paid plans covering GDPR Article 28 requirements.",
  },
];

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link
          to="/dashboard/profile/subscription"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans & credits
        </Link>

        {/* Hero */}
        <section
          className="rounded-3xl p-10 sm:p-16 text-center mb-10 border border-border"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, hsl(150 35% 18% / 0.6) 0%, hsl(150 30% 8%) 60%)",
          }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Secure by design
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose where your data lives, enforce SSO and role-based access, control
            publishing with approvals, and keep your code and prompts out of model training.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity">
              Trust center
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              Report an issue
            </button>
          </div>
        </section>

        {/* Compliance badges */}
        <section className="rounded-2xl border border-border bg-card p-8 mb-10">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Independently audited and certified
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <img src={badgeSoc2} alt="SOC 2 Type II" className="w-20 h-20 object-contain" />
              <p className="text-xs text-muted-foreground">SOC 2 Type II</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src={badgeGdpr} alt="GDPR" className="w-20 h-20 object-contain" />
              <p className="text-xs text-muted-foreground">GDPR compliant</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img src={badgeIso} alt="ISO 27001" className="w-20 h-20 object-contain" />
              <p className="text-xs text-muted-foreground">ISO 27001</p>
            </div>
          </div>
        </section>

        {/* Enterprise controls */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Enterprise security controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {controls.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Governance */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Governance & trust</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {governance.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-1">{g.title}</h3>
              <p className="text-sm text-muted-foreground">{g.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Need more details?
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Reach out for our security whitepaper, SOC 2 report, or to start a custom
            enterprise security review.
          </p>
          <a
            href="mailto:security@yangu.io"
            className="inline-flex px-5 py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Contact security team
          </a>
        </div>
      </div>
    </div>
  );
}