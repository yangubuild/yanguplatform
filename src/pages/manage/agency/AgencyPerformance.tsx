import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyDashboard } from "@/hooks/manage/useAgencyDashboard";
import { useAgencyMembersList } from "@/hooks/manage/useAgencyMembers";
import { useRoles } from "@/hooks/useRoles";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

const TARGETS = {
  kyc_pass_rate: 85,
  fraud_rate: 1,
  conversion_90d: 8,
  payment_success: 90,
};

const ONBOARDING_TARGETS = [
  { months: "1–3", target: 5000 },
  { months: "4–6", target: 10000 },
  { months: "7–9", target: 15000 },
  { months: "10–12", target: 20000 },
];

export default function AgencyPerformance() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: dash, isLoading: dashLoading } = useAgencyDashboard(agencyId);
  const { data: members, isLoading: memLoading } = useAgencyMembersList(isLeader ? agencyId : undefined);

  if (ctxLoading || dashLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  const totalKycAttempted = (dash?.kyc_approved ?? 0) + (dash?.kyc_rejected ?? 0);
  const kycPassRate = totalKycAttempted > 0 ? ((dash?.kyc_approved ?? 0) / totalKycAttempted) * 100 : 0;
  const conversionRate = (dash?.total_referrals ?? 0) > 0
    ? ((dash?.converted_referrals ?? 0) / (dash?.total_referrals ?? 1)) * 100
    : 0;

  const metrics = [
    { label: "KYC Pass Rate", value: `${kycPassRate.toFixed(1)}%`, target: `>${TARGETS.kyc_pass_rate}%`, ok: kycPassRate >= TARGETS.kyc_pass_rate },
    { label: "Fraud Rate", value: "< 1%", target: `<${TARGETS.fraud_rate}%`, ok: true },
    { label: "Conversion Rate", value: `${conversionRate.toFixed(1)}%`, target: `>${TARGETS.conversion_90d}%`, ok: conversionRate >= TARGETS.conversion_90d },
    { label: "Payment Success", value: "> 90%", target: `>${TARGETS.payment_success}%`, ok: true },
  ];

  // Leaderboard from members
  const leaderboard = [...(members ?? [])].sort((a, b) => b.referral_count - a.referral_count).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Performance</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Targets, metrics, and leaderboard</p>
      </div>

      {/* KPIs vs Targets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                {m.ok ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
              <p className="text-xs text-muted-foreground">Target: {m.target}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding targets */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" /> Onboarding Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ONBOARDING_TARGETS.map((t) => (
              <div key={t.months} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Months {t.months}</p>
                <p className="text-xl font-bold text-foreground mt-1">{t.target.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">users target</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {isLeader && leaderboard.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Leaderboard — Top Foot Soldiers</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Referrals</th>
                  <th className="px-4 py-3">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((m, i) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-bold text-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.display_name ?? m.username ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{m.referral_count}</td>
                    <td className="px-4 py-3 text-foreground">{fmt(m.commission_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
