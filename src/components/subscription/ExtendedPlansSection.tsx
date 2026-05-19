import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck, Globe2, Award } from "lucide-react";
import giftCardClassic from "@/assets/gift-card-classic.png";
import giftCardBuild from "@/assets/gift-card-build.png";
import giftCardAbstract from "@/assets/gift-card-abstract.png";
import { SpecialProgramApplyDialog, type ProgramType } from "./SpecialProgramApplyDialog";

const benefitCards: Array<{
  type: ProgramType;
  title: string;
  description: string;
}> = [
  {
    type: "student",
    title: "YANGU for Students",
    description:
      "Give verified students discounted access to YANGU tools and creator workflows.",
  },
  {
    type: "campus",
    title: "YANGU for Campus",
    description:
      "Billing, team access, administrative controls and scalable YANGU tools for universities and institutions.",
  },
  {
    type: "non_profit",
    title: "YANGU for Non-Profit",
    description:
      "Discounted access for NGOs, charities, social impact teams and registered non-profit organizations.",
  },
];

export function ExtendedPlansSection() {
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState<ProgramType | null>(null);

  return (
    <section className="mt-12 space-y-4">
      {/* Card A — Gift Cards */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 overflow-hidden">
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Gift Cards
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto md:mx-0">
            Send a YANGU gift card to friends, teams, creators or businesses.
          </p>
          <button
            onClick={() => navigate("/gift-cards")}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            See all gift cards
          </button>
        </div>
        <div className="relative w-[260px] h-[170px] sm:w-[320px] sm:h-[200px] shrink-0">
          <img
            src={giftCardAbstract}
            alt=""
            className="absolute top-2 right-0 w-[170px] sm:w-[210px] rounded-xl shadow-lg rotate-[8deg]"
          />
          <img
            src={giftCardBuild}
            alt=""
            className="absolute top-4 left-6 w-[170px] sm:w-[210px] rounded-xl shadow-lg -rotate-[6deg]"
          />
          <img
            src={giftCardClassic}
            alt="YANGU gift card"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] sm:w-[220px] rounded-xl shadow-2xl rotate-[2deg]"
          />
        </div>
      </div>

      {/* Card B — 3 Benefit Cards Row */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {benefitCards.map((card) => (
            <div key={card.type} className="p-6 flex flex-col">
              <h4 className="text-base font-bold text-foreground mb-2">
                {card.title}
              </h4>
              <p className="text-sm text-muted-foreground mb-5 flex-1">
                {card.description}
              </p>
              <button
                onClick={() => setApplyOpen(card.type)}
                className="self-start inline-flex items-center justify-center rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Apply now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Trust / Compliance */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
            Security and compliance
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto md:mx-0">
            Enterprise-grade security, privacy and operational compliance built for trusted growth.
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <ComplianceBadge icon={<ShieldCheck className="w-5 h-5" />} label="SOC 2" sub="TYPE II" />
          <ComplianceBadge icon={<Globe2 className="w-5 h-5" />} label="GDPR" />
          <ComplianceBadge icon={<Award className="w-5 h-5" />} label="ISO 27001" />
        </div>
        <button className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-background/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
          Learn more
        </button>
      </div>

      <SpecialProgramApplyDialog
        open={applyOpen !== null}
        type={applyOpen ?? "student"}
        onOpenChange={(open) => !open && setApplyOpen(null)}
      />
    </section>
  );
}

function ComplianceBadge({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="w-[78px] h-[78px] rounded-full border border-border flex flex-col items-center justify-center text-muted-foreground gap-0.5">
      {icon}
      <span className="text-[10px] font-bold tracking-wide text-foreground">{label}</span>
      {sub && <span className="text-[8px] tracking-wider text-muted-foreground">{sub}</span>}
    </div>
  );
}
