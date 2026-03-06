import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, Shield, Users, Crown, ArrowRight } from "lucide-react";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";

/* ────────────────────────────────────────────
   Score badge component matching source exactly
   ──────────────────────────────────────────── */
function ScoreBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-full border-2 border-foreground/80 flex items-center justify-center text-sm font-bold text-foreground">
        {value}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Problem card component
   ──────────────────────────────────────────── */
function ProblemCard({
  title,
  demand,
  income,
  ease,
  slug,
}: {
  title: string;
  demand: number;
  income: number;
  ease: number;
  slug: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
      <h3 className="font-semibold text-foreground text-sm leading-snug">{title}</h3>
      <div className="border-t border-border" />
      <div className="flex items-center justify-between">
        <ScoreBadge value={demand} label="Demand" />
        <ScoreBadge value={income} label="Income" />
        <ScoreBadge value={ease} label="Ease" />
      </div>
      <Link
        to={`/dashboard/visionaire/evergreen/${slug}`}
        className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 pt-1 font-medium transition-colors"
      >
        Explore Idea <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ────────────────────────────────────────────
   Category section icons
   ──────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  revenue: <TrendingUp className="h-5 w-5 text-foreground" />,
  profit: <DollarSign className="h-5 w-5 text-foreground" />,
  predictability: <Shield className="h-5 w-5 text-foreground" />,
  team: <Users className="h-5 w-5 text-foreground" />,
  freedom: <Crown className="h-5 w-5 text-foreground" />,
};

/* ────────────────────────────────────────────
   Category section component
   ──────────────────────────────────────────── */
function CategorySection({
  categoryKey,
  title,
  description,
  count,
  problems,
}: {
  categoryKey: string;
  title: string;
  description: string;
  count: number;
  problems: { title: string; demand: number; income: number; ease: number; slug: string }[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Left: Category info card */}
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center">
            {CATEGORY_ICONS[categoryKey]}
          </div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <span className="inline-block text-xs font-medium text-muted-foreground border border-border rounded-md px-2.5 py-1 uppercase tracking-wider">
            {count} Opportunities
          </span>
        </div>

        {/* Right: Problem cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((p) => (
            <ProblemCard key={p.slug} {...p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Full data extracted from source
   ──────────────────────────────────────────── */
const CATEGORIES = [
  {
    key: "revenue",
    title: "More Revenue",
    description: "Businesses always want more customers, more sales, and more growth.",
    count: 56,
    problems: [
      { title: "Low landing page opt-ins", demand: 10, income: 8, ease: 4, slug: "low-landing-page-opt-ins" },
      { title: "Social media presence unoptimized", demand: 10, income: 7, ease: 3, slug: "social-media-unoptimized" },
      { title: "Slow lead response times", demand: 10, income: 8, ease: 4, slug: "slow-lead-response-times" },
      { title: "No CRM or pipeline management", demand: 9, income: 8, ease: 4, slug: "no-crm-or-pipeline-management" },
      { title: "No system for nurturing warm traffic", demand: 9, income: 8, ease: 4, slug: "no-system-nurturing" },
      { title: "Organic traffic too low", demand: 10, income: 9, ease: 6, slug: "organic-traffic-too-low" },
      { title: "No system for attracting cold traffic", demand: 10, income: 9, ease: 7, slug: "no-system-cold-traffic" },
      { title: "No email list", demand: 10, income: 8, ease: 3, slug: "no-email-list" },
      { title: "Wrong marketing channels", demand: 9, income: 7, ease: 4, slug: "wrong-marketing-channels" },
      { title: "Weak follow-up", demand: 10, income: 8, ease: 4, slug: "weak-follow-up" },
      { title: "No outbound or prospecting system", demand: 10, income: 9, ease: 4, slug: "no-outbound-prospecting-system" },
      { title: "Unqualified leads entering sales", demand: 9, income: 8, ease: 5, slug: "unqualified-leads-sales" },
      { title: "No discovery process", demand: 8, income: 8, ease: 5, slug: "no-discovery-process" },
      { title: "No consistent leads", demand: 10, income: 9, ease: 5, slug: "no-consistent-leads" },
      { title: "No backend offers", demand: 8, income: 9, ease: 5, slug: "no-backend-offers" },
      { title: "Inactive customers", demand: 9, income: 8, ease: 4, slug: "inactive-customers" },
      { title: "Low close rates", demand: 10, income: 9, ease: 5, slug: "low-close-rates" },
      { title: "Low lifetime value (LTV)", demand: 8, income: 9, ease: 6, slug: "low-lifetime-value" },
      { title: "No clear promised outcome", demand: 9, income: 8, ease: 4, slug: "no-clear-promised-outcome" },
      { title: "Low-quality leads", demand: 10, income: 8, ease: 4, slug: "low-quality-leads" },
      { title: "No content machine generating demand", demand: 10, income: 9, ease: 5, slug: "no-content-machine-generating-demand" },
      { title: "No community or follow-up touchpoints", demand: 9, income: 8, ease: 4, slug: "no-community-followup" },
      { title: "No evergreen lead engine", demand: 10, income: 9, ease: 7, slug: "no-evergreen-lead-engine" },
      { title: "No post-purchase communication", demand: 9, income: 8, ease: 3, slug: "no-post-purchase-communication" },
      { title: "No repeat customers", demand: 9, income: 8, ease: 4, slug: "no-repeat-customers" },
      { title: "No re-engagement campaigns", demand: 9, income: 8, ease: 4, slug: "no-re-engagement-campaigns" },
      { title: "No testing or optimization system", demand: 8, income: 9, ease: 6, slug: "no-testing-optimization-system" },
      { title: "No structured sales process", demand: 9, income: 8, ease: 5, slug: "no-structured-sales-process" },
      { title: "No win-back system", demand: 9, income: 8, ease: 4, slug: "no-win-back-system" },
      { title: "No transformation communicated", demand: 9, income: 8, ease: 4, slug: "no-transformation-communicated" },
      { title: "Offer solves a non-urgent problem", demand: 9, income: 9, ease: 6, slug: "offer-solves-non-urgent-problem" },
      { title: "Paid traffic not profitable", demand: 9, income: 9, ease: 7, slug: "paid-traffic-not-profitable" },
      { title: "Unpredictable lead flow", demand: 10, income: 9, ease: 6, slug: "unpredictable-lead-flow" },
      { title: "Slow email list growth", demand: 9, income: 8, ease: 4, slug: "slow-email-list-growth" },
      { title: "Weak customer research", demand: 9, income: 8, ease: 4, slug: "weak-customer-research" },
      { title: "Weak email nurturing", demand: 9, income: 8, ease: 4, slug: "weak-email-nurturing" },
      { title: "Weak objection handling", demand: 9, income: 8, ease: 4, slug: "weak-objection-handling" },
      { title: "Weak lead magnet or entry offer", demand: 10, income: 8, ease: 3, slug: "weak-lead-magnet" },
      { title: "No upsells or cross-sells", demand: 9, income: 8, ease: 3, slug: "no-upsells-or-cross-sells" },
      { title: "Weak value proposition", demand: 10, income: 9, ease: 5, slug: "weak-value-proposition" },
      { title: "No post-purchase education", demand: 8, income: 7, ease: 4, slug: "no-post-purchase-education" },
      { title: "No lead qualification process", demand: 9, income: 8, ease: 5, slug: "no-lead-qualification-process" },
      { title: "No customer success system", demand: 9, income: 8, ease: 4, slug: "no-customer-success-system" },
      { title: "Low website conversion rates", demand: 10, income: 9, ease: 6, slug: "low-website-conversion-rates" },
      { title: "Long sales cycles", demand: 8, income: 9, ease: 7, slug: "long-sales-cycles" },
      { title: "High cart abandonment", demand: 10, income: 8, ease: 4, slug: "high-cart-abandonment" },
      { title: "Offer doesn't match audience needs", demand: 8, income: 9, ease: 5, slug: "offer-mismatch" },
      { title: "No segmentation strategy", demand: 9, income: 8, ease: 5, slug: "no-segmentation-strategy" },
      { title: "No lead capture strategy", demand: 10, income: 8, ease: 4, slug: "no-lead-capture-strategy" },
      { title: "Checkout problems", demand: 9, income: 8, ease: 4, slug: "checkout-problems" },
      { title: "Confusing funnel structure", demand: 8, income: 9, ease: 6, slug: "confusing-funnel-structure" },
      { title: "No sales scripts or frameworks", demand: 9, income: 8, ease: 4, slug: "no-sales-scripts-or-frameworks" },
      { title: "Poor pricing presentation", demand: 9, income: 8, ease: 4, slug: "poor-pricing-presentation" },
      { title: "Weak onboarding", demand: 8, income: 7, ease: 4, slug: "weak-onboarding" },
      { title: "No clear target audience", demand: 10, income: 9, ease: 3, slug: "no-clear-target-audience" },
      { title: "Weak testimonials", demand: 9, income: 7, ease: 3, slug: "weak-testimonials" },
    ],
  },
  {
    key: "profit",
    title: "More Profit & Better Cash Flow",
    description: "Revenue is meaningless if profit doesn't follow.",
    count: 27,
    problems: [
      { title: "Dependence on one-time sales", demand: 10, income: 9, ease: 6, slug: "dependence-on-one-time-sales" },
      { title: "No pricing strategy", demand: 8, income: 9, ease: 5, slug: "no-pricing-strategy" },
      { title: "Contractor/team overhead too high", demand: 8, income: 9, ease: 7, slug: "contractor-overhead-too-high" },
      { title: "Pricing too complicated", demand: 9, income: 8, ease: 4, slug: "pricing-too-complicated" },
      { title: "Discounting too often", demand: 9, income: 8, ease: 4, slug: "discounting-too-often" },
      { title: "Slow invoicing process", demand: 9, income: 7, ease: 3, slug: "slow-invoicing-process" },
      { title: "Products priced wrong relative to effort", demand: 9, income: 8, ease: 5, slug: "products-priced-wrong-relative-to-effort" },
      { title: "No savings buffer", demand: 10, income: 8, ease: 4, slug: "no-savings-buffer" },
      { title: "Weak retainer offers", demand: 8, income: 9, ease: 6, slug: "weak-retainer-offers" },
      { title: "Unpredictable cash flow", demand: 10, income: 9, ease: 5, slug: "unpredictable-cash-flow" },
      { title: "Underpriced offers", demand: 9, income: 9, ease: 4, slug: "underpriced-offers" },
      { title: "No budgeting or financial planning", demand: 10, income: 9, ease: 5, slug: "no-budgeting-financial-planning" },
      { title: "Operational waste", demand: 9, income: 8, ease: 4, slug: "operational-waste" },
      { title: "Race-to-the-bottom competition", demand: 8, income: 9, ease: 5, slug: "race-to-the-bottom" },
      { title: "Late payments", demand: 9, income: 7, ease: 4, slug: "late-payments" },
      { title: "High subscription churn", demand: 9, income: 9, ease: 6, slug: "high-subscription-churn" },
      { title: "No automated payment collection", demand: 9, income: 8, ease: 4, slug: "no-automated-payment-collection" },
      { title: "Overspending on ads", demand: 9, income: 9, ease: 6, slug: "overspending-on-ads" },
      { title: "Low profit margins", demand: 9, income: 10, ease: 6, slug: "low-profit-margins" },
      { title: "High cost per acquisition", demand: 10, income: 9, ease: 6, slug: "high-cost-per-acquisition" },
      { title: "Poor packaging of services", demand: 9, income: 8, ease: 4, slug: "poor-packaging-of-services" },
      { title: "No premium version of offer", demand: 9, income: 8, ease: 4, slug: "no-premium-version" },
      { title: "No payment plans", demand: 8, income: 7, ease: 3, slug: "no-payment-plans" },
      { title: "No expense tracking", demand: 10, income: 8, ease: 4, slug: "no-expense-tracking" },
      { title: "No billing automation", demand: 8, income: 7, ease: 4, slug: "no-billing-automation" },
      { title: "Inefficient fulfillment costs", demand: 8, income: 9, ease: 7, slug: "inefficient-fulfillment-costs" },
      { title: "Expenses and income out of sync", demand: 9, income: 8, ease: 5, slug: "expenses-and-income-out-of-sync" },
    ],
  },
  {
    key: "predictability",
    title: "More Predictability & Less Risk",
    description: "A business wants stability — not surprises.",
    count: 18,
    problems: [
      { title: "No crisis management plan", demand: 6, income: 9, ease: 5, slug: "no-crisis-management-plan" },
      { title: "Overreliance on referrals", demand: 10, income: 9, ease: 5, slug: "overreliance-on-referrals" },
      { title: "Seasonal revenue drops", demand: 9, income: 8, ease: 5, slug: "seasonal-revenue-drops" },
      { title: "Dependence on one marketing channel", demand: 10, income: 9, ease: 6, slug: "dependence-on-one-marketing-channel" },
      { title: "Depends on unpredictable sales spikes", demand: 9, income: 9, ease: 7, slug: "unpredictable-sales-spikes" },
      { title: "Dependence on one product", demand: 7, income: 8, ease: 6, slug: "dependence-on-one-product" },
      { title: "Missing contracts", demand: 9, income: 8, ease: 5, slug: "missing-contracts" },
      { title: "No analytics setup", demand: 10, income: 8, ease: 5, slug: "no-analytics-setup" },
      { title: "No legal documentation", demand: 9, income: 8, ease: 5, slug: "no-legal-documentation" },
      { title: "Dependence on one team member", demand: 9, income: 8, ease: 6, slug: "dependence-on-one-team-member" },
      { title: "Outdated terms and policies", demand: 9, income: 7, ease: 5, slug: "outdated-terms-policies" },
      { title: "No plan for recurring revenue", demand: 9, income: 9, ease: 6, slug: "no-plan-for-recurring-revenue" },
      { title: "Platform risk (Instagram, TikTok, Ads)", demand: 9, income: 9, ease: 5, slug: "platform-risk" },
      { title: "Data privacy or security issues", demand: 10, income: 9, ease: 6, slug: "data-privacy-security" },
      { title: "No plan for market downturns", demand: 7, income: 9, ease: 6, slug: "no-plan-for-market-downturns" },
      { title: "No forecasting system", demand: 8, income: 9, ease: 6, slug: "no-forecasting-system" },
      { title: "Dependence on one client", demand: 9, income: 8, ease: 5, slug: "dependence-on-one-client" },
      { title: "No business dashboard", demand: 9, income: 8, ease: 4, slug: "no-business-dashboard" },
    ],
  },
  {
    key: "team",
    title: "Better Team Performance & Execution",
    description: "As a business grows, team problems become business problems.",
    count: 12,
    problems: [
      { title: "Founder doing most tasks", demand: 10, income: 9, ease: 5, slug: "founder-doing-most-tasks" },
      { title: "No onboarding process", demand: 9, income: 7, ease: 4, slug: "no-onboarding-process" },
      { title: "Poor employer brand", demand: 9, income: 8, ease: 4, slug: "poor-employer-brand" },
      { title: "Poor delegation", demand: 10, income: 9, ease: 5, slug: "poor-delegation" },
      { title: "No training materials", demand: 9, income: 8, ease: 4, slug: "no-training-materials" },
      { title: "Misalignment between team members", demand: 9, income: 8, ease: 4, slug: "misalignment-between-team-members" },
      { title: "No hiring process", demand: 9, income: 8, ease: 4, slug: "no-hiring-process" },
      { title: "Slow ramp-up for new hires", demand: 9, income: 8, ease: 4, slug: "slow-ramp-up-new-hires" },
      { title: "Attracting wrong applicants", demand: 10, income: 8, ease: 4, slug: "attracting-wrong-applicants" },
      { title: "Founder training everyone manually", demand: 9, income: 8, ease: 4, slug: "founder-training-manually" },
      { title: "Underperforming team members", demand: 10, income: 9, ease: 6, slug: "underperforming-team-members" },
      { title: "Hard to find qualified candidates", demand: 9, income: 8, ease: 4, slug: "hard-to-find-qualified-candidates" },
    ],
  },
  {
    key: "freedom",
    title: "More Freedom & Control for the Owner",
    description: "Entrepreneurs want a business that supports their life, not one that consumes it.",
    count: 13,
    problems: [
      { title: "Weak boundaries with clients", demand: 10, income: 8, ease: 4, slug: "weak-client-boundaries" },
      { title: "Too many meetings", demand: 10, income: 7, ease: 3, slug: "too-many-meetings" },
      { title: "No business direction", demand: 10, income: 8, ease: 4, slug: "no-business-direction" },
      { title: "No control over schedule", demand: 10, income: 8, ease: 4, slug: "no-control-schedule" },
      { title: "Doing work below pay grade", demand: 10, income: 8, ease: 4, slug: "doing-work-below-pay-grade" },
      { title: "Constant context switching", demand: 10, income: 8, ease: 4, slug: "constant-context-switching" },
      { title: "Business cannot run without the founder", demand: 9, income: 9, ease: 6, slug: "founder-dependency" },
      { title: "Constant stress", demand: 10, income: 8, ease: 4, slug: "constant-stress" },
      { title: "No exit or long-term plan", demand: 7, income: 10, ease: 7, slug: "no-exit-plan" },
      { title: "Too many tasks on founder plate", demand: 10, income: 8, ease: 4, slug: "too-many-tasks-founder-plate" },
      { title: "Chronic overwork", demand: 10, income: 9, ease: 5, slug: "chronic-overwork" },
      { title: "Founder working nights/weekends", demand: 10, income: 9, ease: 5, slug: "founder-working-nights-weekends" },
      { title: "No deep work time", demand: 10, income: 8, ease: 4, slug: "no-deep-work-time" },
    ],
  },
];

export default function EvergreenProblems() {
  return (
    <VisionairePageContainer>
      <div className="space-y-12 pb-12">
        {/* ── Hero ── */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <span className="w-0.5 h-4 bg-foreground rounded-full" />
            200 Curated Ideas
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold text-foreground tracking-tight leading-[1.1]">
            200 Evergreen Problems<br />Every Business Faces
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            A curated vault of business opportunities rooted in universal human desires. Don't chase trends. Solve one of these for businesses, and you have a business for life.
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-border" />

        {/* ── Category Sections ── */}
        {CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.key}
            categoryKey={cat.key}
            title={cat.title}
            description={cat.description}
            count={cat.count}
            problems={cat.problems}
          />
        ))}
      </div>
    </VisionairePageContainer>
  );
}
