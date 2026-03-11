import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Lightbulb, DollarSign, Zap, Target, Rocket, MessageSquare } from "lucide-react";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { Button } from "@/components/ui/button";
import evergreenData from "@/data/evergreen-problems.json";

/* ─── Slug lookup for all problems ─── */
const ALL_PROBLEMS = [
  { title: "No backend offers", demand: 8, income: 9, ease: 5, slug: "no-backend-offers", category: "More Revenue" },
  { title: "No system for attracting cold traffic", demand: 10, income: 9, ease: 7, slug: "no-system-cold-traffic", category: "More Revenue" },
  { title: "No lead qualification process", demand: 9, income: 8, ease: 5, slug: "no-lead-qualification-process", category: "More Revenue" },
  { title: "No re-engagement campaigns", demand: 9, income: 8, ease: 4, slug: "no-re-engagement-campaigns", category: "More Revenue" },
  { title: "No testing or optimization system", demand: 8, income: 9, ease: 6, slug: "no-testing-optimization-system", category: "More Revenue" },
  { title: "No structured sales process", demand: 9, income: 8, ease: 5, slug: "no-structured-sales-process", category: "More Revenue" },
  { title: "No win-back system", demand: 9, income: 8, ease: 4, slug: "no-win-back-system", category: "More Revenue" },
  { title: "No transformation communicated", demand: 9, income: 8, ease: 4, slug: "no-transformation-communicated", category: "More Revenue" },
  { title: "Offer solves a non-urgent problem", demand: 9, income: 9, ease: 6, slug: "offer-solves-non-urgent-problem", category: "More Revenue" },
  { title: "Paid traffic not profitable", demand: 9, income: 9, ease: 7, slug: "paid-traffic-not-profitable", category: "More Revenue" },
  { title: "Unpredictable lead flow", demand: 10, income: 9, ease: 6, slug: "unpredictable-lead-flow", category: "More Revenue" },
  { title: "Slow email list growth", demand: 9, income: 8, ease: 4, slug: "slow-email-list-growth", category: "More Revenue" },
  { title: "Weak customer research", demand: 9, income: 8, ease: 4, slug: "weak-customer-research", category: "More Revenue" },
  { title: "Weak email nurturing", demand: 9, income: 8, ease: 4, slug: "weak-email-nurturing", category: "More Revenue" },
  { title: "Weak objection handling", demand: 9, income: 8, ease: 4, slug: "weak-objection-handling", category: "More Revenue" },
  { title: "Weak lead magnet or entry offer", demand: 10, income: 8, ease: 3, slug: "weak-lead-magnet", category: "More Revenue" },
  { title: "No customer success system", demand: 9, income: 8, ease: 4, slug: "no-customer-success-system", category: "More Revenue" },
  { title: "Weak value proposition", demand: 10, income: 9, ease: 5, slug: "weak-value-proposition", category: "More Revenue" },
  { title: "Long sales cycles", demand: 8, income: 9, ease: 7, slug: "long-sales-cycles", category: "More Revenue" },
  { title: "No clear target audience", demand: 10, income: 9, ease: 3, slug: "no-clear-target-audience", category: "More Revenue" },
  { title: "Low website conversion rates", demand: 10, income: 9, ease: 6, slug: "low-website-conversion-rates", category: "More Revenue" },
  { title: "Checkout problems", demand: 9, income: 8, ease: 4, slug: "checkout-problems", category: "More Revenue" },
  { title: "Confusing funnel structure", demand: 8, income: 9, ease: 6, slug: "confusing-funnel-structure", category: "More Revenue" },
  { title: "No sales scripts or frameworks", demand: 9, income: 8, ease: 4, slug: "no-sales-scripts-or-frameworks", category: "More Revenue" },
  { title: "Weak follow-up", demand: 10, income: 8, ease: 4, slug: "weak-follow-up", category: "More Revenue" },
  { title: "Low landing page opt-ins", demand: 10, income: 8, ease: 4, slug: "low-landing-page-opt-ins", category: "More Revenue" },
  { title: "No CRM or pipeline management", demand: 9, income: 8, ease: 4, slug: "no-crm-or-pipeline-management", category: "More Revenue" },
];

/* ─── Build title→richData lookup from JSON ─── */
interface RichData {
  subtitle: string;
  scoreDescription: string;
  motivation: { hook: string; explanation: string };
  monetization: {
    quickWin: { title: string; description: string; price: string; benefit: string };
    coreAsset: { title: string; description: string; price: string; benefit: string };
    highTicket: { title: string; description: string; price: string; benefit: string };
  };
  executionPlan: string;
  offerAngles: string[];
}

const richDataByTitle = new Map<string, RichData>();
(evergreenData as unknown as (RichData & { title: string })[]).forEach((item) => {
  richDataByTitle.set(item.title.toLowerCase(), item);
});

/* ─── Score Badge ─── */
function ScoreBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full border-2 border-foreground/80 flex items-center justify-center text-base font-bold text-foreground">
        {value}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}

/* ─── Monetization Card ─── */
function MonetizationCard({
  tier,
  title,
  description,
  price,
  benefit,
  icon,
}: {
  tier: string;
  title: string;
  description: string;
  price: string;
  benefit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{tier}</span>
      </div>
      <h4 className="font-bold text-foreground text-sm">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm font-bold text-foreground">{price}</span>
      </div>
      <p className="text-xs text-muted-foreground italic">{benefit}</p>
    </div>
  );
}

export default function EvergreenProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const problem = ALL_PROBLEMS.find((p) => p.slug === slug);

  if (!problem) {
    return (
      <VisionairePageContainer>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Problem not found</h1>
          <Link to="/dashboard/visionaire/evergreen" className="text-primary mt-4 inline-block">
            ← Back to Evergreen Problems
          </Link>
        </div>
      </VisionairePageContainer>
    );
  }

  const rich = richDataByTitle.get(problem.title.toLowerCase()) || null;

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12 pt-4">
        {/* Back link */}
        <Link
          to="/dashboard/visionaire/evergreen"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Evergreen Problems
        </Link>

        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          {problem.category}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {problem.title}
        </h1>

        {/* Subtitle from JSON */}
        {rich && (
          <p className="text-muted-foreground leading-relaxed text-base max-w-3xl">
            {rich.subtitle}
          </p>
        )}

        {/* Scores */}
        <div className="flex items-center gap-8 py-4">
          <ScoreBadge value={problem.demand} label="Demand" />
          <ScoreBadge value={problem.income} label="Income" />
          <ScoreBadge value={problem.ease} label="Ease" />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Score description */}
        {rich && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground">About this opportunity</h2>
            <p className="text-muted-foreground leading-relaxed">{rich.scoreDescription}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.demand}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Market Demand</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.income}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Income Potential</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.ease}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Ease of Entry</div>
              </div>
            </div>
          </div>
        )}

        {/* Motivation / Why This Matters */}
        {rich && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Why This Matters</h2>
            </div>
            <blockquote className="border-l-2 border-foreground/30 pl-4 text-foreground font-semibold italic text-base">
              "{rich.motivation.hook}"
            </blockquote>
            <p className="text-muted-foreground leading-relaxed">{rich.motivation.explanation}</p>
          </div>
        )}

        {/* Monetization */}
        {rich && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">How to Monetize</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MonetizationCard
                tier="Quick Win"
                icon={<Zap className="h-4 w-4 text-foreground" />}
                title={rich.monetization.quickWin.title}
                description={rich.monetization.quickWin.description}
                price={rich.monetization.quickWin.price}
                benefit={rich.monetization.quickWin.benefit}
              />
              <MonetizationCard
                tier="Core Asset"
                icon={<Target className="h-4 w-4 text-foreground" />}
                title={rich.monetization.coreAsset.title}
                description={rich.monetization.coreAsset.description}
                price={rich.monetization.coreAsset.price}
                benefit={rich.monetization.coreAsset.benefit}
              />
              <MonetizationCard
                tier="High Ticket"
                icon={<Rocket className="h-4 w-4 text-foreground" />}
                title={rich.monetization.highTicket.title}
                description={rich.monetization.highTicket.description}
                price={rich.monetization.highTicket.price}
                benefit={rich.monetization.highTicket.benefit}
              />
            </div>
          </div>
        )}

        {/* Execution Plan */}
        {rich && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Execution Plan</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{rich.executionPlan}</p>
          </div>
        )}

        {/* Offer Angles */}
        {rich && rich.offerAngles.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Offer Angles</h2>
            </div>
            <p className="text-xs text-muted-foreground">Use these hooks in your marketing copy, ads, and sales pages.</p>
            <ul className="space-y-2">
              {rich.offerAngles.map((angle, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-foreground/60 font-bold text-sm mt-0.5">→</span>
                  <span className="text-muted-foreground text-sm leading-relaxed">{angle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fallback for problems without rich data */}
        {!rich && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground">About this opportunity</h2>
            <p className="text-muted-foreground leading-relaxed">
              This is an evergreen business problem that businesses face consistently. With a demand score of {problem.demand}, income potential of {problem.income}, and ease of entry at {problem.ease}, this represents a significant opportunity to build a sustainable business around solving this problem.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.demand}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Market Demand</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.income}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Income Potential</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{problem.ease}/10</div>
                <div className="text-xs text-muted-foreground mt-1">Ease of Entry</div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link to="/dashboard/visionaire/evergreen">
              Browse All Problems
            </Link>
          </Button>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
