import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { Button } from "@/components/ui/button";

/* We import the same data to look up the problem by slug */
const ALL_PROBLEMS = [
  { title: "Low landing page opt-ins", demand: 10, income: 8, ease: 4, slug: "low-landing-page-opt-ins", category: "More Revenue" },
  { title: "Social media presence unoptimized", demand: 10, income: 7, ease: 3, slug: "social-media-unoptimized", category: "More Revenue" },
  { title: "Slow lead response times", demand: 10, income: 8, ease: 4, slug: "slow-lead-response-times", category: "More Revenue" },
  { title: "No CRM or pipeline management", demand: 9, income: 8, ease: 4, slug: "no-crm-or-pipeline-management", category: "More Revenue" },
  { title: "No system for nurturing warm traffic", demand: 9, income: 8, ease: 4, slug: "no-system-nurturing", category: "More Revenue" },
  { title: "Organic traffic too low", demand: 10, income: 9, ease: 6, slug: "organic-traffic-too-low", category: "More Revenue" },
  { title: "No system for attracting cold traffic", demand: 10, income: 9, ease: 7, slug: "no-system-cold-traffic", category: "More Revenue" },
  { title: "No email list", demand: 10, income: 8, ease: 3, slug: "no-email-list", category: "More Revenue" },
  { title: "Wrong marketing channels", demand: 9, income: 7, ease: 4, slug: "wrong-marketing-channels", category: "More Revenue" },
  { title: "Weak follow-up", demand: 10, income: 8, ease: 4, slug: "weak-follow-up", category: "More Revenue" },
  { title: "No outbound or prospecting system", demand: 10, income: 9, ease: 4, slug: "no-outbound-prospecting-system", category: "More Revenue" },
  { title: "Unqualified leads entering sales", demand: 9, income: 8, ease: 5, slug: "unqualified-leads-sales", category: "More Revenue" },
  { title: "No discovery process", demand: 8, income: 8, ease: 5, slug: "no-discovery-process", category: "More Revenue" },
  { title: "No consistent leads", demand: 10, income: 9, ease: 5, slug: "no-consistent-leads", category: "More Revenue" },
  { title: "No backend offers", demand: 8, income: 9, ease: 5, slug: "no-backend-offers", category: "More Revenue" },
  { title: "Inactive customers", demand: 9, income: 8, ease: 4, slug: "inactive-customers", category: "More Revenue" },
  { title: "Low close rates", demand: 10, income: 9, ease: 5, slug: "low-close-rates", category: "More Revenue" },
  { title: "Low lifetime value (LTV)", demand: 8, income: 9, ease: 6, slug: "low-lifetime-value", category: "More Revenue" },
  { title: "No clear promised outcome", demand: 9, income: 8, ease: 4, slug: "no-clear-promised-outcome", category: "More Revenue" },
  { title: "Low-quality leads", demand: 10, income: 8, ease: 4, slug: "low-quality-leads", category: "More Revenue" },
  { title: "No content machine generating demand", demand: 10, income: 9, ease: 5, slug: "no-content-machine-generating-demand", category: "More Revenue" },
  { title: "No community or follow-up touchpoints", demand: 9, income: 8, ease: 4, slug: "no-community-followup", category: "More Revenue" },
  { title: "No evergreen lead engine", demand: 10, income: 9, ease: 7, slug: "no-evergreen-lead-engine", category: "More Revenue" },
  { title: "No post-purchase communication", demand: 9, income: 8, ease: 3, slug: "no-post-purchase-communication", category: "More Revenue" },
  { title: "No repeat customers", demand: 9, income: 8, ease: 4, slug: "no-repeat-customers", category: "More Revenue" },
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
  { title: "No upsells or cross-sells", demand: 9, income: 8, ease: 3, slug: "no-upsells-or-cross-sells", category: "More Revenue" },
  { title: "Weak value proposition", demand: 10, income: 9, ease: 5, slug: "weak-value-proposition", category: "More Revenue" },
  { title: "No post-purchase education", demand: 8, income: 7, ease: 4, slug: "no-post-purchase-education", category: "More Revenue" },
  { title: "No lead qualification process", demand: 9, income: 8, ease: 5, slug: "no-lead-qualification-process", category: "More Revenue" },
  { title: "No customer success system", demand: 9, income: 8, ease: 4, slug: "no-customer-success-system", category: "More Revenue" },
  { title: "Low website conversion rates", demand: 10, income: 9, ease: 6, slug: "low-website-conversion-rates", category: "More Revenue" },
  { title: "Long sales cycles", demand: 8, income: 9, ease: 7, slug: "long-sales-cycles", category: "More Revenue" },
  { title: "High cart abandonment", demand: 10, income: 8, ease: 4, slug: "high-cart-abandonment", category: "More Revenue" },
  { title: "Offer doesn't match audience needs", demand: 8, income: 9, ease: 5, slug: "offer-mismatch", category: "More Revenue" },
  { title: "No segmentation strategy", demand: 9, income: 8, ease: 5, slug: "no-segmentation-strategy", category: "More Revenue" },
  { title: "No lead capture strategy", demand: 10, income: 8, ease: 4, slug: "no-lead-capture-strategy", category: "More Revenue" },
  { title: "Checkout problems", demand: 9, income: 8, ease: 4, slug: "checkout-problems", category: "More Revenue" },
  { title: "Confusing funnel structure", demand: 8, income: 9, ease: 6, slug: "confusing-funnel-structure", category: "More Revenue" },
  { title: "No sales scripts or frameworks", demand: 9, income: 8, ease: 4, slug: "no-sales-scripts-or-frameworks", category: "More Revenue" },
  { title: "Poor pricing presentation", demand: 9, income: 8, ease: 4, slug: "poor-pricing-presentation", category: "More Revenue" },
  { title: "Weak onboarding", demand: 8, income: 7, ease: 4, slug: "weak-onboarding", category: "More Revenue" },
  { title: "No clear target audience", demand: 10, income: 9, ease: 3, slug: "no-clear-target-audience", category: "More Revenue" },
  { title: "Weak testimonials", demand: 9, income: 7, ease: 3, slug: "weak-testimonials", category: "More Revenue" },
  { title: "Dependence on one-time sales", demand: 10, income: 9, ease: 6, slug: "dependence-on-one-time-sales", category: "More Profit & Better Cash Flow" },
  { title: "No pricing strategy", demand: 8, income: 9, ease: 5, slug: "no-pricing-strategy", category: "More Profit & Better Cash Flow" },
  { title: "Contractor/team overhead too high", demand: 8, income: 9, ease: 7, slug: "contractor-overhead-too-high", category: "More Profit & Better Cash Flow" },
  { title: "Pricing too complicated", demand: 9, income: 8, ease: 4, slug: "pricing-too-complicated", category: "More Profit & Better Cash Flow" },
  { title: "Discounting too often", demand: 9, income: 8, ease: 4, slug: "discounting-too-often", category: "More Profit & Better Cash Flow" },
  { title: "Slow invoicing process", demand: 9, income: 7, ease: 3, slug: "slow-invoicing-process", category: "More Profit & Better Cash Flow" },
  { title: "Products priced wrong relative to effort", demand: 9, income: 8, ease: 5, slug: "products-priced-wrong-relative-to-effort", category: "More Profit & Better Cash Flow" },
  { title: "No savings buffer", demand: 10, income: 8, ease: 4, slug: "no-savings-buffer", category: "More Profit & Better Cash Flow" },
  { title: "Weak retainer offers", demand: 8, income: 9, ease: 6, slug: "weak-retainer-offers", category: "More Profit & Better Cash Flow" },
  { title: "Unpredictable cash flow", demand: 10, income: 9, ease: 5, slug: "unpredictable-cash-flow", category: "More Profit & Better Cash Flow" },
  { title: "Underpriced offers", demand: 9, income: 9, ease: 4, slug: "underpriced-offers", category: "More Profit & Better Cash Flow" },
  { title: "No budgeting or financial planning", demand: 10, income: 9, ease: 5, slug: "no-budgeting-financial-planning", category: "More Profit & Better Cash Flow" },
  { title: "Operational waste", demand: 9, income: 8, ease: 4, slug: "operational-waste", category: "More Profit & Better Cash Flow" },
  { title: "Race-to-the-bottom competition", demand: 8, income: 9, ease: 5, slug: "race-to-the-bottom", category: "More Profit & Better Cash Flow" },
  { title: "Late payments", demand: 9, income: 7, ease: 4, slug: "late-payments", category: "More Profit & Better Cash Flow" },
  { title: "High subscription churn", demand: 9, income: 9, ease: 6, slug: "high-subscription-churn", category: "More Profit & Better Cash Flow" },
  { title: "No automated payment collection", demand: 9, income: 8, ease: 4, slug: "no-automated-payment-collection", category: "More Profit & Better Cash Flow" },
  { title: "Overspending on ads", demand: 9, income: 9, ease: 6, slug: "overspending-on-ads", category: "More Profit & Better Cash Flow" },
  { title: "Low profit margins", demand: 9, income: 10, ease: 6, slug: "low-profit-margins", category: "More Profit & Better Cash Flow" },
  { title: "High cost per acquisition", demand: 10, income: 9, ease: 6, slug: "high-cost-per-acquisition", category: "More Profit & Better Cash Flow" },
  { title: "Poor packaging of services", demand: 9, income: 8, ease: 4, slug: "poor-packaging-of-services", category: "More Profit & Better Cash Flow" },
  { title: "No premium version of offer", demand: 9, income: 8, ease: 4, slug: "no-premium-version", category: "More Profit & Better Cash Flow" },
  { title: "No payment plans", demand: 8, income: 7, ease: 3, slug: "no-payment-plans", category: "More Profit & Better Cash Flow" },
  { title: "No expense tracking", demand: 10, income: 8, ease: 4, slug: "no-expense-tracking", category: "More Profit & Better Cash Flow" },
  { title: "No billing automation", demand: 8, income: 7, ease: 4, slug: "no-billing-automation", category: "More Profit & Better Cash Flow" },
  { title: "Inefficient fulfillment costs", demand: 8, income: 9, ease: 7, slug: "inefficient-fulfillment-costs", category: "More Profit & Better Cash Flow" },
  { title: "Expenses and income out of sync", demand: 9, income: 8, ease: 5, slug: "expenses-and-income-out-of-sync", category: "More Profit & Better Cash Flow" },
  { title: "No crisis management plan", demand: 6, income: 9, ease: 5, slug: "no-crisis-management-plan", category: "More Predictability & Less Risk" },
  { title: "Overreliance on referrals", demand: 10, income: 9, ease: 5, slug: "overreliance-on-referrals", category: "More Predictability & Less Risk" },
  { title: "Seasonal revenue drops", demand: 9, income: 8, ease: 5, slug: "seasonal-revenue-drops", category: "More Predictability & Less Risk" },
  { title: "Dependence on one marketing channel", demand: 10, income: 9, ease: 6, slug: "dependence-on-one-marketing-channel", category: "More Predictability & Less Risk" },
  { title: "Depends on unpredictable sales spikes", demand: 9, income: 9, ease: 7, slug: "unpredictable-sales-spikes", category: "More Predictability & Less Risk" },
  { title: "Dependence on one product", demand: 7, income: 8, ease: 6, slug: "dependence-on-one-product", category: "More Predictability & Less Risk" },
  { title: "Missing contracts", demand: 9, income: 8, ease: 5, slug: "missing-contracts", category: "More Predictability & Less Risk" },
  { title: "No analytics setup", demand: 10, income: 8, ease: 5, slug: "no-analytics-setup", category: "More Predictability & Less Risk" },
  { title: "No legal documentation", demand: 9, income: 8, ease: 5, slug: "no-legal-documentation", category: "More Predictability & Less Risk" },
  { title: "Dependence on one team member", demand: 9, income: 8, ease: 6, slug: "dependence-on-one-team-member", category: "More Predictability & Less Risk" },
  { title: "Outdated terms and policies", demand: 9, income: 7, ease: 5, slug: "outdated-terms-policies", category: "More Predictability & Less Risk" },
  { title: "No plan for recurring revenue", demand: 9, income: 9, ease: 6, slug: "no-plan-for-recurring-revenue", category: "More Predictability & Less Risk" },
  { title: "Platform risk (Instagram, TikTok, Ads)", demand: 9, income: 9, ease: 5, slug: "platform-risk", category: "More Predictability & Less Risk" },
  { title: "Data privacy or security issues", demand: 10, income: 9, ease: 6, slug: "data-privacy-security", category: "More Predictability & Less Risk" },
  { title: "No plan for market downturns", demand: 7, income: 9, ease: 6, slug: "no-plan-for-market-downturns", category: "More Predictability & Less Risk" },
  { title: "No forecasting system", demand: 8, income: 9, ease: 6, slug: "no-forecasting-system", category: "More Predictability & Less Risk" },
  { title: "Dependence on one client", demand: 9, income: 8, ease: 5, slug: "dependence-on-one-client", category: "More Predictability & Less Risk" },
  { title: "No business dashboard", demand: 9, income: 8, ease: 4, slug: "no-business-dashboard", category: "More Predictability & Less Risk" },
  { title: "Founder doing most tasks", demand: 10, income: 9, ease: 5, slug: "founder-doing-most-tasks", category: "Better Team Performance & Execution" },
  { title: "No onboarding process", demand: 9, income: 7, ease: 4, slug: "no-onboarding-process", category: "Better Team Performance & Execution" },
  { title: "Poor employer brand", demand: 9, income: 8, ease: 4, slug: "poor-employer-brand", category: "Better Team Performance & Execution" },
  { title: "Poor delegation", demand: 10, income: 9, ease: 5, slug: "poor-delegation", category: "Better Team Performance & Execution" },
  { title: "No training materials", demand: 9, income: 8, ease: 4, slug: "no-training-materials", category: "Better Team Performance & Execution" },
  { title: "Misalignment between team members", demand: 9, income: 8, ease: 4, slug: "misalignment-between-team-members", category: "Better Team Performance & Execution" },
  { title: "No hiring process", demand: 9, income: 8, ease: 4, slug: "no-hiring-process", category: "Better Team Performance & Execution" },
  { title: "Slow ramp-up for new hires", demand: 9, income: 8, ease: 4, slug: "slow-ramp-up-new-hires", category: "Better Team Performance & Execution" },
  { title: "Attracting wrong applicants", demand: 10, income: 8, ease: 4, slug: "attracting-wrong-applicants", category: "Better Team Performance & Execution" },
  { title: "Founder training everyone manually", demand: 9, income: 8, ease: 4, slug: "founder-training-manually", category: "Better Team Performance & Execution" },
  { title: "Underperforming team members", demand: 10, income: 9, ease: 6, slug: "underperforming-team-members", category: "Better Team Performance & Execution" },
  { title: "Hard to find qualified candidates", demand: 9, income: 8, ease: 4, slug: "hard-to-find-qualified-candidates", category: "Better Team Performance & Execution" },
  { title: "Weak boundaries with clients", demand: 10, income: 8, ease: 4, slug: "weak-client-boundaries", category: "More Freedom & Control for the Owner" },
  { title: "Too many meetings", demand: 10, income: 7, ease: 3, slug: "too-many-meetings", category: "More Freedom & Control for the Owner" },
  { title: "No business direction", demand: 10, income: 8, ease: 4, slug: "no-business-direction", category: "More Freedom & Control for the Owner" },
  { title: "No control over schedule", demand: 10, income: 8, ease: 4, slug: "no-control-schedule", category: "More Freedom & Control for the Owner" },
  { title: "Doing work below pay grade", demand: 10, income: 8, ease: 4, slug: "doing-work-below-pay-grade", category: "More Freedom & Control for the Owner" },
  { title: "Constant context switching", demand: 10, income: 8, ease: 4, slug: "constant-context-switching", category: "More Freedom & Control for the Owner" },
  { title: "Business cannot run without the founder", demand: 9, income: 9, ease: 6, slug: "founder-dependency", category: "More Freedom & Control for the Owner" },
  { title: "Constant stress", demand: 10, income: 8, ease: 4, slug: "constant-stress", category: "More Freedom & Control for the Owner" },
  { title: "No exit or long-term plan", demand: 7, income: 10, ease: 7, slug: "no-exit-plan", category: "More Freedom & Control for the Owner" },
  { title: "Too many tasks on founder plate", demand: 10, income: 8, ease: 4, slug: "too-many-tasks-founder-plate", category: "More Freedom & Control for the Owner" },
  { title: "Chronic overwork", demand: 10, income: 9, ease: 5, slug: "chronic-overwork", category: "More Freedom & Control for the Owner" },
  { title: "Founder working nights/weekends", demand: 10, income: 9, ease: 5, slug: "founder-working-nights-weekends", category: "More Freedom & Control for the Owner" },
  { title: "No deep work time", demand: 10, income: 8, ease: 4, slug: "no-deep-work-time", category: "More Freedom & Control for the Owner" },
];

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

        {/* Scores */}
        <div className="flex items-center gap-8 py-4">
          <ScoreBadge value={problem.demand} label="Demand" />
          <ScoreBadge value={problem.income} label="Income" />
          <ScoreBadge value={problem.ease} label="Ease" />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Content area */}
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
