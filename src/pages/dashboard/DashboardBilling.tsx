import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Check, Crown, Sparkles, Zap, Building2, ImageIcon, Video, UserCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Entitlements {
  plan_id: string;
  published_surfaces_limit: number;
  ai_images_monthly_limit: number;
  ai_videos_monthly_limit: number;
  ai_avatars_monthly_limit: number;
  ai_images_used: number;
  ai_videos_used: number;
  ai_avatars_used: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  is_admin_bypass: boolean;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Sparkles,
    features: ["1 published surface", "Basic editor access", "Community support"],
    limits: { surfaces: 1, images: 0, videos: 0, avatars: 0 },
  },
  {
    id: "creator",
    name: "Creator",
    price: "$15",
    period: "/mo",
    icon: Zap,
    popular: true,
    features: ["3 published surfaces", "10 AI images/mo", "5 AI videos/mo", "1 AI avatar/mo", "Priority support"],
    limits: { surfaces: 3, images: 10, videos: 5, avatars: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    price: "$100",
    period: "/mo",
    icon: Crown,
    features: ["15 published surfaces", "100 AI images/mo", "30 AI videos/mo", "5 AI avatars/mo", "Custom domains", "Advanced analytics"],
    limits: { surfaces: 15, images: 100, videos: 30, avatars: 5 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    icon: Building2,
    features: ["Unlimited surfaces", "Unlimited AI credits", "Dedicated support", "Custom integrations", "SLA guarantee"],
    limits: { surfaces: 9999, images: 9999, videos: 9999, avatars: 9999 },
  },
];

function QuotaBar({ label, icon: Icon, used, limit }: { label: string; icon: any; used: number; limit: number; }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit >= 9999;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className="font-medium">
          {isUnlimited ? "Unlimited" : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && limit > 0 && (
        <Progress value={pct} className="h-1.5" />
      )}
      {limit === 0 && (
        <p className="text-xs text-muted-foreground">Not included in your plan</p>
      )}
    </div>
  );
}

export default function DashboardBilling() {
  const { user } = useAuth();
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    if (!user) return;
    try {
      // Ensure row exists
      await supabase.rpc("ensure_my_entitlements" as any);
      const { data } = await supabase.rpc("get_my_entitlements" as any);
      if (data) setEnt(data as unknown as Entitlements);
    } catch (err) {
      console.error("[Billing] Error fetching entitlements:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchEntitlements(); }, [fetchEntitlements]);

  const currentPlan = ent?.plan_id || "free";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing & Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and usage quotas
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <h3 className="font-medium text-sm">Payments coming soon</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Online payments are under development. Plan upgrades will be available here once ready.
            Contact support for Enterprise or manual plan changes.
          </p>
        </div>
      </div>

      {/* Current plan + usage */}
      {!loading && ent && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>
              <p className="text-lg font-bold capitalize mt-0.5">{currentPlan}</p>
            </div>
            {ent.is_admin_bypass && (
              <Badge variant="outline" className="text-xs">Admin Bypass</Badge>
            )}
          </div>

          {ent.billing_period_start && ent.billing_period_end && (
            <p className="text-xs text-muted-foreground">
              Billing period: {new Date(ent.billing_period_start).toLocaleDateString()} – {new Date(ent.billing_period_end).toLocaleDateString()}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <QuotaBar label="Published Surfaces" icon={Globe} used={0} limit={ent.published_surfaces_limit} />
            <QuotaBar label="AI Images" icon={ImageIcon} used={ent.ai_images_used} limit={ent.ai_images_monthly_limit} />
            <QuotaBar label="AI Videos" icon={Video} used={ent.ai_videos_used} limit={ent.ai_videos_monthly_limit} />
            <QuotaBar label="AI Avatars" icon={UserCircle} used={ent.ai_avatars_used} limit={ent.ai_avatars_monthly_limit} />
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground text-sm">
          Loading plan details…
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-lg border p-5 flex flex-col relative ${
                  plan.popular ? "border-primary border-2" : "border-border"
                } bg-card`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                    Popular
                  </div>
                )}
                <plan.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1">
                  {plan.price}
                  {plan.period && <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>}
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5 mt-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={isCurrent ? "outline" : "default"}
                  disabled
                >
                  {isCurrent ? "Current Plan" : "Coming Soon"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
