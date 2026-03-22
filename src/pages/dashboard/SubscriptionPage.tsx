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
    <div className="max-w-4xl mx-auto py-6 px-4 min-h-screen" style={{ background: "#08120D" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-semibold text-foreground">Choose a plan that works for you</h1>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          {(["personal", "business"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBillingType(t)}
              className="px-4 py-1.5 text-sm font-medium capitalize transition-colors"
              style={{
                background: billingType === t ? "rgba(255,255,255,0.1)" : "transparent",
                color: billingType === t ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
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
            className="rounded-2xl p-6 flex flex-col relative"
            style={{
              background: plan.current ? "#1a2025" : "#232a30",
              border: plan.popular ? "2px solid #2d5a3d" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {plan.popular && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.15)", }}
              >
                Most Popular
              </span>
            )}
            {plan.highValue && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ background: "#1a2025", border: "1px solid rgba(255,255,255,0.15)", }}
              >
                Highest Value
              </span>
            )}

            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            <p className="text-xs mb-3" className="text-muted-foreground">{plan.description}</p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {plan.price}<span className="text-sm font-normal" className="text-muted-foreground">/mo</span>
            </p>

            <div className="h-px my-3" style={{ background: "rgba(255,255,255,0.08)" }} />

            <div className="space-y-1 mb-4">
              {plan.highlights.map((h) => (
                <p key={h} className="text-sm" className="text-muted-foreground">{h}</p>
              ))}
            </div>

            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold mt-auto transition-colors"
              style={{
                background: plan.current ? "transparent" : "#2d5a3d",
                border: plan.current ? "1px solid rgba(255,255,255,0.15)" : "none",
                color: plan.current ? "rgba(255,255,255,0.5)" : "#fff",
              }}
            >
              {plan.current ? "Current Plan" : "Get Started"}
            </button>

            <div className="mt-4">
              <p className="text-xs font-bold mb-2" className="text-muted-foreground">Plan highlights:</p>
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 mb-1">
                  <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                  <span className="text-xs" className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current plan */}
        <div className="rounded-2xl p-5" style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium" className="text-muted-foreground">Your Current Plan</p>
            <Star className="w-4 h-4" className="text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground mb-0.5">Free</p>
          <p className="text-xs mb-4" className="text-muted-foreground">Member since Dec 25, 2025</p>
          <button
            onClick={() => navigate("/dashboard/profile/subscription")}
            className="flex items-center gap-2 w-full justify-center py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(255,255,255,0.12)", }}
          >
            <Settings className="w-4 h-4" /> Manage Subscription
          </button>
        </div>

        {/* Credits */}
        <div className="rounded-2xl p-5" style={{ background: "#232a30", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium" className="text-muted-foreground">Credits Remaining</p>
            <CreditCard className="w-4 h-4" className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-bold text-foreground">{balance}</p>
            <p className="text-xs" className="text-muted-foreground">of 1</p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(balance * 100, 100)}%`, background: "#2d5a3d" }} />
          </div>
          <p className="text-xs mt-2" className="text-muted-foreground">
            You get 1 credit per month, this will refresh monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
