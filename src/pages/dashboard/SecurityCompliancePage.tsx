import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Shield, Lock, FileCheck, Users, Database, Eye,
  Home, FileText, ScrollText, Server, AlertTriangle, Siren,
  Globe, Award, Mail,
} from "lucide-react";
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

type SectionId =
  | "overview"
  | "trust-center"
  | "dpa"
  | "subprocessors"
  | "whitepaper"
  | "vulnerability"
  | "incident"
  | "privacy"
  | "compliance"
  | "report";

const NAV: { id: SectionId; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "trust-center", label: "Trust center", icon: Shield },
  { id: "dpa", label: "Data Processing Agreement", icon: FileText },
  { id: "subprocessors", label: "Sub-processors", icon: Server },
  { id: "whitepaper", label: "Security whitepaper", icon: ScrollText },
  { id: "vulnerability", label: "Vulnerability disclosure", icon: AlertTriangle },
  { id: "incident", label: "Incident response", icon: Siren },
  { id: "privacy", label: "Privacy & data residency", icon: Globe },
  { id: "compliance", label: "Compliance & certifications", icon: Award },
  { id: "report", label: "Report an issue", icon: Mail },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-foreground mb-4">{children}</h2>;
}

function Overview({ go }: { go: (id: SectionId) => void }) {
  return (
    <>
      <section
        className="rounded-3xl p-10 sm:p-14 text-center mb-8 border border-border"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, hsl(150 35% 18% / 0.6) 0%, hsl(150 30% 8%) 60%)",
        }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Secure by design</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Choose where your data lives, enforce SSO and role-based access, control publishing
          with approvals, and keep your code and prompts out of model training.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => go("trust-center")}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Trust center
          </button>
          <button
            onClick={() => go("report")}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Report an issue
          </button>
        </div>
      </section>

      <Card className="mb-8">
        <p className="text-sm text-muted-foreground text-center mb-6">
          Independently audited and certified
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10">
           {[
             { img: badgeSoc2, label: "SOC 2 Type II", boost: true },
             { img: badgeGdpr, label: "GDPR compliant", boost: false },
             { img: badgeIso, label: "ISO 27001", boost: false },
           ].map((b) => (
             <div key={b.label} className="flex flex-col items-center gap-2">
               <img src={b.img} alt={b.label} className={`object-contain ${b.boost ? "w-24 h-24 scale-125" : "w-20 h-20"}`} />
               <p className="text-xs text-muted-foreground">{b.label}</p>
             </div>
           ))}
         </div>
       </Card>

       <SectionTitle>Enterprise security controls</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </>
  );
}

function TrustCenter({ go }: { go: (id: SectionId) => void }) {
  const items: { id: SectionId; title: string; desc: string }[] = [
    { id: "dpa", title: "Data Processing Agreement", desc: "GDPR Article 28 DPA covering yangu's processing of customer personal data." },
    { id: "subprocessors", title: "Sub-processors", desc: "Current list of third-party providers that process customer data on our behalf." },
    { id: "whitepaper", title: "Security whitepaper", desc: "Technical overview of our infrastructure, controls, and operational security." },
    { id: "vulnerability", title: "Vulnerability disclosure", desc: "Coordinated disclosure program for reporting security issues responsibly." },
    { id: "incident", title: "Incident response", desc: "Documented playbooks with defined SLAs for detection, containment, and recovery." },
    { id: "privacy", title: "Privacy & data residency", desc: "Where your data lives, retention policies, and opt-outs from model training." },
    { id: "compliance", title: "Compliance & certifications", desc: "SOC 2 Type II, ISO 27001, and GDPR audit details and report requests." },
  ];
  return (
    <>
      <SectionTitle>Trust center</SectionTitle>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        A single hub for everything related to security, privacy, and compliance at yangu.
        Browse the documents below or jump straight to a topic from the sidebar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => go(it.id)}
            className="text-left rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
            <p className="text-sm text-muted-foreground">{it.desc}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function Dpa() {
  return (
    <>
      <SectionTitle>Data Processing Agreement (DPA)</SectionTitle>
      <p className="text-xs text-muted-foreground mb-6">Last updated: November 6, 2025</p>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <p>
            If you're on a Business or Enterprise plan, your usage includes our Data Processing
            Agreement (DPA). This DPA forms part of the Terms of Service ordered by the Customer
            under an Order Form (the "Agreement") between yangu and the Customer.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Acknowledgements</h3>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>This DPA does not establish a joint controllership arrangement under Article 26 of the GDPR.</li>
            <li>Each party remains solely responsible for its own compliance with Applicable Data Protection Laws in respect of its separate processing activities.</li>
            <li>yangu processes Customer Personal Data solely on behalf of and under the instructions of the Customer.</li>
            <li>yangu may process Service Data, Log Data, aggregated data, and de-identified data as an independent controller solely for analytics, security, billing, and product development purposes.</li>
            <li>yangu does not engage in automated decision-making with legal or similarly significant effects on Data Subjects.</li>
          </ol>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Data Protection Officer</h3>
          <p>You can contact our DPO at <a className="text-foreground underline" href="mailto:dpo@yangu.io">dpo@yangu.io</a>.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Scope of processing</h3>
          <p>
            yangu processes Customer Personal Data only to provide the services described in the
            Agreement, including hosting, storage, transmission, analytics required for service
            operation, support, and security monitoring. Processing is limited to the duration of
            the Agreement plus any retention period required by law.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Sub-processors & international transfers</h3>
          <p>
            yangu engages vetted sub-processors listed in the Sub-processors section. International
            transfers rely on Standard Contractual Clauses (SCCs) and supplementary measures where
            required by applicable law.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Request the signed DPA</h3>
          <p>
            Business and Enterprise customers can request a counter-signed copy of the DPA by
            emailing <a className="text-foreground underline" href="mailto:legal@yangu.io">legal@yangu.io</a>.
          </p>
        </Card>
      </div>
    </>
  );
}

function Subprocessors() {
  const rows = [
    { name: "Supabase", purpose: "Managed Postgres, auth, storage", location: "EU / US" },
    { name: "Cloudflare", purpose: "CDN, WAF, DNS", location: "Global" },
    { name: "Resend", purpose: "Transactional email delivery", location: "EU / US" },
    { name: "Stripe", purpose: "Payment processing", location: "EU / US" },
    { name: "PostHog", purpose: "Product analytics", location: "EU" },
    { name: "Sentry", purpose: "Error monitoring", location: "EU" },
  ];
  return (
    <>
      <SectionTitle>Sub-processors</SectionTitle>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        yangu engages the following sub-processors to provide our services. We notify customers
        of material changes to this list.
      </p>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Purpose</th>
              <th className="px-5 py-3">Region</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-3 text-foreground font-medium">{r.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.purpose}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Whitepaper() {
  return (
    <>
      <SectionTitle>Security whitepaper</SectionTitle>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Infrastructure</h3>
          <p>Hosted on hardened cloud infrastructure with isolated environments per tenant, encrypted volumes, and least-privilege IAM across all services.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Application security</h3>
          <p>SDLC includes peer code review, dependency scanning, secret scanning, and automated security tests on every change. Row-Level Security enforces tenant isolation at the database layer.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Operational security</h3>
          <p>24/7 monitoring, centralized logging, on-call rotation, and quarterly access reviews. Production access requires MFA and is fully audited.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Request the full whitepaper</h3>
          <p>Email <a className="text-foreground underline" href="mailto:security@yangu.io">security@yangu.io</a> to request the full security whitepaper or SOC 2 report under NDA.</p>
        </Card>
      </div>
    </>
  );
}

function Vulnerability() {
  return (
    <>
      <SectionTitle>Vulnerability disclosure</SectionTitle>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <p>
            We welcome reports from security researchers. If you believe you've discovered a
            vulnerability in any yangu product or service, please disclose it responsibly via the
            channel below. We commit to acknowledging valid reports within 2 business days.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Scope</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>yangu web application and published surfaces</li>
            <li>yangu APIs and edge functions</li>
            <li>Mobile applications shipped by yangu</li>
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Out of scope</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Denial of service or volumetric attacks</li>
            <li>Reports from automated scanners without verified impact</li>
            <li>Issues in third-party services we don't own</li>
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Submit a report</h3>
          <p>Email <a className="text-foreground underline" href="mailto:security@yangu.io">security@yangu.io</a>. Encrypt sensitive details with our PGP key on request.</p>
        </Card>
      </div>
    </>
  );
}

function Incident() {
  return (
    <>
      <SectionTitle>Incident response</SectionTitle>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <p>Our incident response program is documented, drilled, and aligned with SOC 2 and GDPR requirements.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Lifecycle</h3>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li><span className="text-foreground font-medium">Detect.</span> Automated alerts + 24/7 on-call.</li>
            <li><span className="text-foreground font-medium">Triage.</span> Severity assigned within 30 minutes of acknowledgement.</li>
            <li><span className="text-foreground font-medium">Contain.</span> Isolate affected systems and rotate credentials.</li>
            <li><span className="text-foreground font-medium">Eradicate & recover.</span> Patch, restore, verify.</li>
            <li><span className="text-foreground font-medium">Notify.</span> Affected customers notified per contractual and regulatory SLAs.</li>
            <li><span className="text-foreground font-medium">Post-mortem.</span> Blameless review with corrective actions tracked to closure.</li>
          </ol>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Status & notifications</h3>
          <p>Subscribe to status updates and material incident notifications at status.yangu.io.</p>
        </Card>
      </div>
    </>
  );
}

function Privacy() {
  return (
    <>
      <SectionTitle>Privacy & data residency</SectionTitle>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Where your data lives</h3>
          <p>You can select EU or US data residency for production data. Backups remain in the selected region.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Model training opt-out</h3>
          <p>Customer prompts, code, and content are never used to train foundation models. AI providers are bound by contract not to retain customer data beyond what is required to return a response.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Retention</h3>
          <p>Customer data is retained while the workspace is active and for up to 30 days after deletion, unless a longer retention is legally required.</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Data subject requests</h3>
          <p>Submit DSARs (access, deletion, portability) to <a className="text-foreground underline" href="mailto:privacy@yangu.io">privacy@yangu.io</a>.</p>
        </Card>
      </div>
    </>
  );
}

function Compliance() {
  return (
    <>
      <SectionTitle>Compliance & certifications</SectionTitle>
      <Card className="mb-6">
         <div className="flex flex-wrap items-center justify-center gap-10">
           {[
             { img: badgeSoc2, label: "SOC 2 Type II", boost: true },
             { img: badgeGdpr, label: "GDPR compliant", boost: false },
             { img: badgeIso, label: "ISO 27001", boost: false },
           ].map((b) => (
             <div key={b.label} className="flex flex-col items-center gap-2">
               <img src={b.img} alt={b.label} className={`object-contain ${b.boost ? "w-24 h-24 scale-125" : "w-20 h-20"}`} />
               <p className="text-xs text-muted-foreground">{b.label}</p>
             </div>
           ))}
         </div>
      </Card>
      <p className="text-sm text-muted-foreground max-w-2xl">
        SOC 2 Type II and ISO 27001 reports are available to current and prospective customers
        under NDA. Email <a className="text-foreground underline" href="mailto:security@yangu.io">security@yangu.io</a> to request access.
      </p>
    </>
  );
}

function Report() {
  return (
    <>
      <SectionTitle>Report an issue</SectionTitle>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <Card>
          <p>
            Found a security issue, suspicious activity, or abuse? Email our team and we'll
            acknowledge within 2 business days.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-foreground mb-2">Contacts</h3>
          <ul className="space-y-1.5">
            <li>Security & vulnerabilities: <a className="text-foreground underline" href="mailto:security@yangu.io">security@yangu.io</a></li>
            <li>Privacy & DSARs: <a className="text-foreground underline" href="mailto:privacy@yangu.io">privacy@yangu.io</a></li>
            <li>Legal & DPA: <a className="text-foreground underline" href="mailto:legal@yangu.io">legal@yangu.io</a></li>
          </ul>
        </Card>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:security@yangu.io"
            className="inline-flex px-5 py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Email security@yangu.io
          </a>
        </div>
      </div>
    </>
  );
}

export default function SecurityCompliancePage() {
  const [section, setSection] = useState<SectionId>("overview");

  const render = () => {
    switch (section) {
      case "overview": return <Overview go={setSection} />;
      case "trust-center": return <TrustCenter go={setSection} />;
      case "dpa": return <Dpa />;
      case "subprocessors": return <Subprocessors />;
      case "whitepaper": return <Whitepaper />;
      case "vulnerability": return <Vulnerability />;
      case "incident": return <Incident />;
      case "privacy": return <Privacy />;
      case "compliance": return <Compliance />;
      case "report": return <Report />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link
          to="/dashboard/profile/subscription"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans & credits
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-2xl border border-border bg-card p-2">
              <nav className="flex flex-col">
                {NAV.map((item) => {
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        active
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">{render()}</main>
        </div>
      </div>
    </div>
  );
}