import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowUpRight } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { ExtendedPlansSection } from "@/components/subscription/ExtendedPlansSection";
import { ManagePlanDialog } from "@/components/subscription/ManagePlanDialog";
import { TopUpCreditsDialog } from "@/components/subscription/TopUpCreditsDialog";
import { Button } from "@/components/ui/button";
import yanguLogoIcon from "@/assets/yangu-logo-icon.png";

const personalPlans = [
  {
    name: "Free",
    price: "$0.00",
    description: "For those who want to give yangu a try",
    features: ["Basic access to all features", "1 Surface", "Basic Generations"],
    highlights: ["1 Surface /mo", "1 Generation /mo"],
    current: true,
    popular: false,
    highValue: false,
  },
  {
    name: "Yangu+",
    price: "$12.99",
    description: "Perfect for creators growing their business",
    features: ["Full access to all features", "5 Surfaces", "Advanced Generations", "Priority Support", "24/7 Support"],
    highlights: ["15 Surfaces /mo", "5 Generations /mo"],
    current: false,
    popular: true,
    highValue: false,
  },
  {
    name: "Yangu Pro",
    price: "$22.99",
    description: "Designed for those who enjoy no limits",
    features: ["Full access to all features", "10 Surfaces", "Advanced Generations", "Priority Support", "24/7 Support"],
    highlights: ["30 Surfaces /mo", "10 Generations /mo"],
    current: false,
    popular: false,
    highValue: true,
  },
];

const businessPlans = [
  {
    name: "Starter",
    price: "$50.00",
    description: "Get your business started on Yangu",
    features: ["Team collaboration", "5 Team members", "10 Surfaces", "Priority Support", "Analytics dashboard"],
    highlights: ["10 Surfaces /mo", "5 Generations /mo"],
    current: false,
    popular: false,
    highValue: false,
  },
  {
    name: "Growth",
    price: "$100.00",
    description: "Scale your operations with advanced tools",
    features: ["Unlimited team members", "25 Surfaces", "Advanced Generations", "Priority Support", "24/7 Support"],
    highlights: ["25 Surfaces /mo", "15 Generations /mo"],
    current: false,
    popular: true,
    highValue: false,
  },
  {
    name: "Scale",
    price: "$300.00",
    description: "Enterprise-grade for maximum impact",
    features: ["Unlimited everything", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options"],
    highlights: ["Unlimited Surfaces", "50 Generations /mo"],
    current: false,
    popular: false,
    highValue: true,
  },
];

export default function SubscriptionPage() {
  const [billingType, setBillingType] = useState<"personal" | "business">("personal");
  const { data: credits } = useCredits();
  const balance = credits?.balance ?? 0;
  const [manageOpen, setManageOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  // Current plan (free baseline until billing engine wired)
  const currentPlanName = "Free";
  const dailyCredits = 5;
  const dailyLimit = 5;
  const monthlyCredits = 0;
  const monthlyLimit = 30;
  const extraCredits = 0;
  const totalCredits = dailyCredits + monthlyCredits + extraCredits;
  const totalLimit = Math.max(dailyLimit + monthlyLimit, 1);
  const dailyPct = (dailyCredits / totalLimit) * 100;
  const monthlyPct = (monthlyCredits / totalLimit) * 100;
  const extraPct = (extraCredits / totalLimit) * 100;

  const plans = billingType === "personal" ? personalPlans : businessPlans;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 min-h-screen bg-background">
      {/* New header: Plans & credits */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plans & credits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription plan and credit balance.
          </p>
        </div>
        <Link
          to="/dashboard/profile/subscription/docs"
          className="inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
        >
          Open docs <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top cards: Current plan + Credits remaining */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Current plan */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <img
              src={yanguLogoIcon}
              alt="yangu"
              className="w-12 h-12 rounded-xl shrink-0 object-contain"
            />
            <div>
              <p className="font-semibold text-foreground">You're on {currentPlanName} plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">Current active plan</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-5 flex-1">
            {[
              "5 daily credits (up to 150/month)",
              "Basic surface access",
              "Community support",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setManageOpen(true)}
            >
              Manage
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setTopUpOpen(true)}
            >
              Top up credits
            </Button>
          </div>
        </div>

        {/* Credits remaining */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between mb-3">
            <p className="font-semibold text-foreground">Credits remaining</p>
            <p className="text-2xl font-bold text-foreground">{totalCredits + balance}</p>
          </div>

          {/* Segmented bar */}
          <div className="w-full h-2 rounded-full overflow-hidden bg-muted flex mb-5">
            <div
              className="h-full"
              style={{ width: `${dailyPct}%`, background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 100%)" }}
            />
            <div
              className="h-full"
              style={{ width: `${monthlyPct}%`, background: "linear-gradient(135deg, #b5622a 0%, #8a3f1a 100%)" }}
            />
            <div
              className="h-full"
              style={{ width: `${extraPct}%`, background: "linear-gradient(135deg, #8a3f1a 0%, #5c2a12 100%)" }}
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">Daily credits</p>
                <p className="text-xs text-muted-foreground">Resets to {dailyLimit} credits in 12 hours</p>
              </div>
              <p className="font-semibold text-foreground">{dailyCredits}</p>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">Monthly credits</p>
                <p className="text-xs text-muted-foreground">Resets to {monthlyLimit} in 30 days</p>
              </div>
              <p className="font-semibold text-foreground">{monthlyCredits}</p>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">Extra credits</p>
                <p className="text-xs text-muted-foreground">
                  {extraCredits > 0
                    ? `${extraCredits} top-up credits expire in 12 months`
                    : "No top-up credits"}
                </p>
              </div>
              <p className="font-semibold text-foreground">{extraCredits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Available plans</h2>
        <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
          {(["personal", "business"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBillingType(t)}
              className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                billingType === t ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-5 flex flex-col relative ${plan.current ? 'bg-card' : 'bg-muted'}`}
            style={{
              border: plan.popular ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
              minHeight: 360,
            }}>
            {plan.popular && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full border border-border bg-card whitespace-nowrap">
                Most Popular
              </span>
            )}
            {plan.highValue && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full border border-border bg-card whitespace-nowrap">
                Highest Value
              </span>
            )}

            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            <p className="text-xs mb-3 text-muted-foreground line-clamp-2">{plan.description}</p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>

            <div className="h-px my-3 bg-border" />

            <div className="space-y-1 mb-4">
              {plan.highlights.map((h) => (
                <p key={h} className="text-sm text-muted-foreground">{h}</p>
              ))}
            </div>

            <button
              className={`w-full py-2.5 rounded-lg text-sm font-semibold mt-auto transition-colors ${
                plan.current
                  ? "bg-transparent border border-border text-muted-foreground"
                  : "text-foreground shadow-md hover:shadow-lg hover:brightness-110"
              }`}
              style={!plan.current ? { background: "linear-gradient(135deg, #c47a3a 0%, #b5622a 50%, #5c2a12 100%)" } : undefined}>
              {plan.current ? "Current Plan" : "Get Started"}
            </button>

            <div className="mt-4">
              <p className="text-xs font-bold mb-2 text-muted-foreground">Plan highlights:</p>
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 mb-1">
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#4ade80" }} />
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ExtendedPlansSection />

      <ManagePlanDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        planName={currentPlanName}
      />
      <TopUpCreditsDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        currentPlan={currentPlanName}
      />
    </div>
  );
}
