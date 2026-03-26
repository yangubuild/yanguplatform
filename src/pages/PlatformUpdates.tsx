import { useNavigate } from "react-router-dom";
import { MarketingShell } from "@/components/primitives/MarketingShell";
import { LandingTestFooter } from "@/components/landing-test/LandingTestFooter";
import yanguLogo from "@/assets/yangu-logo-full.png";
import { Button } from "@/components/ui/button";
import { Sparkles, Bug, Wrench, Megaphone } from "lucide-react";

type UpdateType = "feature" | "fix" | "improvement" | "announcement";

interface PlatformUpdate {
  date: string;
  type: UpdateType;
  title: string;
  description: string;
}

const TYPE_META: Record<UpdateType, { label: string; icon: typeof Sparkles; color: string }> = {
  feature: { label: "New Feature", icon: Sparkles, color: "#F46D2A" },
  fix: { label: "Bug Fix", icon: Bug, color: "#22c55e" },
  improvement: { label: "Improvement", icon: Wrench, color: "#60a5fa" },
  announcement: { label: "Announcement", icon: Megaphone, color: "#f59e0b" },
};

const UPDATES: PlatformUpdate[] = [
  {
    date: "2026-03-26",
    type: "feature",
    title: "Subscription Activated Emails",
    description: "Dynamic subscription confirmation emails now support all plan tiers — Free, Creator, Pro, and Business plans — with smart upsell for Free users.",
  },
  {
    date: "2026-03-25",
    type: "feature",
    title: "Help & Support Hub",
    description: "A dedicated /support page with search, Help Center, Contact Support modal, and instant access to in-app Support Chat.",
  },
  {
    date: "2026-03-24",
    type: "feature",
    title: "App Email System",
    description: "Full transactional email suite with branded templates for system alerts, product confirmations, and account notifications.",
  },
  {
    date: "2026-03-22",
    type: "improvement",
    title: "KYC Verification Flow",
    description: "Improved pre-check modal with visual guides, interactive checklist, and clearer status messaging for pending reviews.",
  },
  {
    date: "2026-03-20",
    type: "feature",
    title: "Visionaire Digital Product Marketplace",
    description: "Browse, save, and request digital products with AI-powered discovery and categorized bundles.",
  },
  {
    date: "2026-03-18",
    type: "improvement",
    title: "Dashboard Navigation Updates",
    description: "Streamlined sidebar navigation with clearer workspace sections and faster loading.",
  },
  {
    date: "2026-03-15",
    type: "feature",
    title: "Studio AI Creative Suite",
    description: "Generate images, videos, AI shorts, product videos, and clone ads — all powered by YANGU AI.",
  },
  {
    date: "2026-03-12",
    type: "fix",
    title: "Surface Publishing Stability",
    description: "Fixed intermittent publishing failures and improved error messaging for domain verification issues.",
  },
  {
    date: "2026-03-10",
    type: "announcement",
    title: "YANGU Creator & Pro Plans",
    description: "New subscription tiers with expanded AI credits, more Surfaces, custom domains, and priority support.",
  },
];

export default function PlatformUpdates() {
  const navigate = useNavigate();

  return (
    <MarketingShell
      header={
        <header className="w-full px-6 py-4">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <img
              src={yanguLogo}
              alt="yangu"
              className="h-7 w-auto cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => navigate("/")}
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/support")}>
              ← Support
            </Button>
          </div>
        </header>
      }
      footer={
        <div className="max-w-[1200px] mx-auto px-6">
          <LandingTestFooter />
        </div>
      }
    >
      <section className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
          Platform Updates
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          New features, fixes, and improvements to YANGU.
        </p>
      </section>

      <section className="max-w-[700px] mx-auto px-4 pb-20">
        <div className="relative border-l border-border/40 ml-4 pl-8 space-y-8">
          {UPDATES.map((update, i) => {
            const meta = TYPE_META[update.type];
            const Icon = meta.icon;
            return (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <div
                  className="absolute -left-[41px] top-1 w-3 h-3 rounded-full border-2"
                  style={{ borderColor: meta.color, backgroundColor: "var(--background)" }}
                />
                <p className="text-xs text-muted-foreground mb-1.5">{update.date}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                  >
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{update.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{update.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
