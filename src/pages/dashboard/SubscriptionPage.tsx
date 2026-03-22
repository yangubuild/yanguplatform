import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, CreditCard, Settings } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

const plans = [
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

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [billingType, setBillingType] = useState<"personal" | "business">("personal");
  const { data: credits } = useCredits();
  const balance = typeof credits === "number" ? credits : 1;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 min-h-screen bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <h1 className="text-lg font-semibold text-foreground">Choose a plan that works for you</h1>
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
            className={`rounded-2xl p-6 flex flex-col relative ${plan.current ? 'bg-card' : 'bg-muted'}`}
            style={{
              border: plan.popular ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))" }}>
            {plan.popular && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full border border-border">
                Most Popular
              </span>
            )}
            {plan.highValue && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full border border-border">
                Highest Value
              </span>
            )}

            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            <p className="text-xs mb-3 text-muted-foreground">{plan.description}</p>
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
                  : "text-foreground shadow-md hover:shadow-lg hover:brightness-110 [background:linear-gradient(135deg,#c47a3a_0%,#b5622a_50%,#5c2a12_100%)]"
              }`}>
              {plan.current ? "Current Plan" : "Get Started"}
            </button>

            <div className="mt-4">
              <p className="text-xs font-bold mb-2 text-muted-foreground">Plan highlights:</p>
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 mb-1">
                  <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current plan */}
        <div className="rounded-2xl p-5 border border-border bg-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Your Current Plan</p>
            <Star className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground mb-0.5">Free</p>
          <p className="text-xs mb-4 text-muted-foreground">Member since Dec 25, 2025</p>
            <button
              onClick={() => navigate("/dashboard/profile/subscription")}
              className="flex items-center gap-2 w-full justify-center py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" /> Manage Subscription
          </button>
        </div>

        {/* Credits */}
        <div className="rounded-2xl p-5 border border-border bg-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Credits Remaining</p>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-bold text-foreground">{balance}</p>
            <p className="text-xs text-muted-foreground">of 1</p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(balance * 100, 100)}%` }} />
          </div>
          <p className="text-xs mt-2 text-muted-foreground">
            You get 1 credit per month, this will refresh monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
