import { useNavigate } from "react-router-dom";
import {
  UserPlus, BarChart3, DollarSign, ShieldCheck, HeadphonesIcon, TrendingUp, Users, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoles } from "@/hooks/useRoles";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyDashboard, useMyAgencyStats } from "@/hooks/manage/useAgencyDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const { isAgencyAdmin, isAgencyManager, isFootSoldier, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: dash, isLoading: dashLoading } = useAgencyDashboard(isLeader ? agencyId : undefined);
  const { data: myStats, isLoading: myLoading } = useMyAgencyStats(agencyId);

  if (ctxLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">No Agency Found</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You are not assigned to any agency. Contact your administrator.
        </p>
      </div>
    );
  }

  const agencyName = (ctx as any)?.agencies?.name ?? "Agency";
  const loading = dashLoading || myLoading;

  const leaderStats = dash ? [
    { label: "Onboarded Users", value: dash.total_referrals },
    { label: "KYC Approved", value: dash.kyc_approved },
    { label: "KYC Pending", value: dash.kyc_pending },
    { label: "KYC Rejected", value: dash.kyc_rejected },
    { label: "Active Subscribers", value: dash.active_subscribers },
    { label: "Foot Soldiers", value: dash.total_members },
    { label: "Total Earned", value: fmt(dash.total_earned_cents) },
    { label: "Pending Payouts", value: fmt(dash.pending_cents) },
    { label: "Phase 1 Earnings", value: fmt(dash.phase1_total_cents) },
    { label: "Phase 2 Recurring", value: fmt(dash.phase2_total_cents) },
    { label: "Converted", value: dash.converted_referrals },
    { label: "Conversion Rate", value: dash.total_referrals > 0 ? `${((dash.converted_referrals / dash.total_referrals) * 100).toFixed(1)}%` : "0%" },
  ] : [];

  const soldierStats = myStats ? [
    { label: "My Referrals", value: myStats.my_referrals },
    { label: "Converted", value: myStats.my_converted },
    { label: "KYC Approved", value: myStats.my_kyc_approved },
    { label: "Total Earned", value: fmt(myStats.my_total_earned_cents) },
    { label: "Pending", value: fmt(myStats.my_pending_cents) },
    { label: "Phase 1", value: fmt(myStats.my_phase1_cents) },
    { label: "Phase 2", value: fmt(myStats.my_phase2_cents) },
  ] : [];

  const displayStats = isLeader ? leaderStats : soldierStats;

  const actionCards = [
    { icon: Users, title: "Members", desc: "Manage foot soldiers", to: "/agency/members", visible: isLeader },
    { icon: UserPlus, title: "Onboarding", desc: "Track referrals & KYC", to: "/agency/onboarding", visible: isLeader },
    { icon: DollarSign, title: "Commissions", desc: "Earnings & payouts", to: "/agency/commissions", visible: true },
    { icon: TrendingUp, title: "Performance", desc: "Targets & leaderboard", to: "/agency/performance", visible: true },
    { icon: BarChart3, title: "Analytics", desc: "Funnels & retention", to: "/agency/analytics", visible: isLeader },
    { icon: CalendarDays, title: "Hub Booking", desc: "Schedule hub time", to: "/agency/hub", visible: true },
    { icon: ShieldCheck, title: "KYC Status", desc: "Verification overview", to: "/agency/kyc", visible: isLeader },
    { icon: HeadphonesIcon, title: "Support", desc: "Tickets & escalation", to: "/agency/support", visible: isLeader },
  ].filter((c) => c.visible);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">{agencyName} Dashboard</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">
          {isLeader ? "Agency-wide operations overview" : "Your personal performance overview"}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayStats.map((s) => (
            <Card key={s.label} className="border border-border bg-card">
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {actionCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border bg-card"
            onClick={() => navigate(card.to)}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted shrink-0">
                <card.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
