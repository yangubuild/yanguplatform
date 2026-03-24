import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyDashboard } from "@/hooks/manage/useAgencyDashboard";
import { useAgencyMembersList } from "@/hooks/manage/useAgencyMembers";
import { useRoles } from "@/hooks/useRoles";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AgencyAnalytics() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: dash, isLoading: dashLoading } = useAgencyDashboard(agencyId);
  const { data: members, isLoading: memLoading } = useAgencyMembersList(isLeader ? agencyId : undefined);

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Analytics is available for agency admins and managers only.</p>
      </div>
    );
  }

  if (ctxLoading || dashLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const totalReferrals = dash?.total_referrals ?? 0;
  const kycApproved = dash?.kyc_approved ?? 0;
  const converted = dash?.converted_referrals ?? 0;
  const subscribers = dash?.active_subscribers ?? 0;
  const churned = dash?.churned_referrals ?? 0;

  const funnelSteps = [
    { label: "Referred", value: totalReferrals, pct: 100 },
    { label: "KYC Approved", value: kycApproved, pct: totalReferrals > 0 ? (kycApproved / totalReferrals) * 100 : 0 },
    { label: "Converted", value: converted, pct: totalReferrals > 0 ? (converted / totalReferrals) * 100 : 0 },
    { label: "Active Subscribers", value: subscribers, pct: totalReferrals > 0 ? (subscribers / totalReferrals) * 100 : 0 },
  ];

  const retentionRate = converted > 0 ? ((converted - churned) / converted) * 100 : 0;
  const churnRate = converted > 0 ? (churned / converted) * 100 : 0;
  const avgRefsPerSoldier = (members?.length ?? 0) > 0 ? totalReferrals / (members?.length ?? 1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Analytics</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Funnels, retention, and contribution insights</p>
      </div>

      {/* Onboarding Funnel */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Onboarding Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{step.label}</span>
                  <span className="text-muted-foreground">{step.value} ({step.pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(step.pct, 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention & Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Retention Rate", value: `${retentionRate.toFixed(1)}%` },
          { label: "Churn Rate", value: `${churnRate.toFixed(1)}%` },
          { label: "Avg Referrals/Soldier", value: avgRefsPerSoldier.toFixed(1) },
          { label: "Revenue Contribution", value: fmt((dash?.total_earned_cents ?? 0) + (dash?.pending_cents ?? 0)) },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member performance comparison */}
      {members && members.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Member Performance Comparison</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Foot Soldier</th>
                  <th className="px-4 py-3">Referrals</th>
                  <th className="px-4 py-3">Earned</th>
                  <th className="px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...members].sort((a, b) => b.referral_count - a.referral_count).map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{m.display_name ?? m.username ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{m.referral_count}</td>
                    <td className="px-4 py-3 text-foreground">{fmt(m.commission_total)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {totalReferrals > 0 ? `${((m.referral_count / totalReferrals) * 100).toFixed(1)}%` : "0%"}
                    </td>
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
