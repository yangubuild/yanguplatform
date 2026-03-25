import { useNavigate } from "react-router-dom";
import { Copy, QrCode, Users, DollarSign, ShieldCheck, TrendingUp, BarChart3, BookOpen, CalendarDays, UserPlus, Wallet, HeadphonesIcon, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRoles } from "@/hooks/useRoles";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyDashboard, useMyAgencyStats } from "@/hooks/manage/useAgencyDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// ─── Foot Soldier Dashboard ──────────────────────────────────
function FootSoldierView({ agencySlug, myStats }: { agencySlug: string; myStats: any }) {
  const [showQr, setShowQr] = useState(false);
  const refLink = `https://yangu.io/join?ref=${agencySlug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6">
      {/* Referral Tool */}
      <Card className="border-2 border-accent/30 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" /> My Referral Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate font-mono">
              {refLink}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowQr(!showQr)}>
              <QrCode className="h-3.5 w-3.5" />
            </Button>
          </div>
          {showQr && (
            <div className="flex justify-center py-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(refLink)}`}
                alt="QR Code"
                className="rounded-lg border border-border"
                width={180}
                height={180}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">My Referrals</p>
            <p className="text-3xl font-bold text-foreground mt-1">{myStats?.my_referrals ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">KYC Approved</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{myStats?.my_kyc_approved ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Converted</p>
            <p className="text-3xl font-bold text-foreground mt-1">{myStats?.my_converted ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Subscribers</p>
            <p className="text-3xl font-bold text-foreground mt-1">{myStats?.my_converted ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> My Earnings This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-3">
            <p className="text-4xl font-bold text-foreground">{fmt(myStats?.my_total_earned_cents ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total earned</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground uppercase">Phase 1 (KYC)</p>
              <p className="text-lg font-bold text-foreground">{fmt(myStats?.my_phase1_cents ?? 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground uppercase">Phase 2 (Subs)</p>
              <p className="text-lg font-bold text-foreground">{fmt(myStats?.my_phase2_cents ?? 0)}</p>
            </div>
          </div>
          {(myStats?.my_pending_cents ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Pending payout: {fmt(myStats.my_pending_cents)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agency Principal / Sales Lead Dashboard ─────────────────
function LeaderView({ dash, navigate }: { dash: any; navigate: any }) {
  const totalTarget = 2000; // monthly target placeholder
  const kycPct = totalTarget > 0 ? Math.min(((dash?.kyc_approved ?? 0) / totalTarget) * 100, 100) : 0;
  const subTarget = 200;
  const subPct = subTarget > 0 ? Math.min(((dash?.active_subscribers ?? 0) / subTarget) * 100, 100) : 0;
  const totalKycAttempted = (dash?.kyc_approved ?? 0) + (dash?.kyc_rejected ?? 0);
  const kycPassRate = totalKycAttempted > 0 ? ((dash?.kyc_approved ?? 0) / totalKycAttempted) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Performance targets */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Agency Performance (This Month)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">KYC Users: {dash?.kyc_approved ?? 0} / {totalTarget.toLocaleString()}</span>
              <span className="text-muted-foreground">{kycPct.toFixed(0)}%</span>
            </div>
            <Progress value={kycPct} className="h-2.5" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground font-medium">Subscribers: {dash?.active_subscribers ?? 0} / {subTarget}</span>
              <span className="text-muted-foreground">{subPct.toFixed(0)}%</span>
            </div>
            <Progress value={subPct} className="h-2.5" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">KYC Pass Rate:</span>
              <Badge variant={kycPassRate >= 85 ? "default" : "destructive"} className="text-xs">
                {kycPassRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Fraud Rate:</span>
              <Badge variant="default" className="text-xs">{"< 1%"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Phase 1 Earned", value: fmt(dash?.phase1_total_cents ?? 0) },
          { label: "Phase 2 Earned", value: fmt(dash?.phase2_total_cents ?? 0) },
          { label: "Total Earned", value: fmt(dash?.total_earned_cents ?? 0) },
          { label: "Pending Payout", value: fmt(dash?.pending_cents ?? 0) },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Team Members", value: dash?.total_members ?? 0 },
          { label: "Total Referrals", value: dash?.total_referrals ?? 0 },
          { label: "KYC Pending", value: dash?.kyc_pending ?? 0 },
          { label: "Active Subscribers", value: dash?.active_subscribers ?? 0 },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, title: "Team", desc: "Manage members", to: "/members" },
          { icon: UserPlus, title: "Onboarding", desc: "Track referrals", to: "/onboarding" },
          { icon: ShieldCheck, title: "KYC Status", desc: "Verify users", to: "/kyc" },
          { icon: DollarSign, title: "Commissions", desc: "View earnings", to: "/commissions" },
          { icon: Wallet, title: "Payouts", desc: "Request payout", to: "/payouts" },
          { icon: BarChart3, title: "Analytics", desc: "Funnels & data", to: "/analytics" },
          { icon: TrendingUp, title: "Performance", desc: "Targets & KPIs", to: "/performance" },
          { icon: CalendarDays, title: "Hub Booking", desc: "Schedule time", to: "/hub" },
        ].map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border active:scale-[0.98]"
            onClick={() => navigate(card.to)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted shrink-0">
                <card.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground truncate">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Finance Officer Dashboard ───────────────────────────────
function FinanceView({ dash, navigate }: { dash: any; navigate: any }) {
  return (
    <div className="space-y-6">
      {/* Commission reconciliation */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Commissions Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground uppercase">Phase 1 (KYC Users)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{fmt(dash?.phase1_total_cents ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{dash?.kyc_approved ?? 0} × $1</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground uppercase">Phase 2 (Subscribers)</p>
              <p className="text-2xl font-bold text-foreground mt-1">{fmt(dash?.phase2_total_cents ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{dash?.active_subscribers ?? 0} × $4/mo</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 text-center">
              <p className="text-xs text-accent uppercase font-medium">Total Agency Commission</p>
              <p className="text-2xl font-bold text-foreground mt-1">{fmt(dash?.total_earned_cents ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending Payout", value: fmt(dash?.pending_cents ?? 0) },
          { label: "Active Subscribers", value: dash?.active_subscribers ?? 0 },
          { label: "Team Members", value: dash?.total_members ?? 0 },
          { label: "Total Referrals", value: dash?.total_referrals ?? 0 },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, title: "Commissions", desc: "Full breakdown", to: "/commissions" },
          { icon: Wallet, title: "Payouts", desc: "Request disbursement", to: "/payouts" },
          { icon: BarChart3, title: "Analytics", desc: "Financial data", to: "/analytics" },
          { icon: FileText, title: "Monthly Report", desc: "Submit to Yangu", to: "/monthly-report" },
        ].map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border active:scale-[0.98]"
            onClick={() => navigate(card.to)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted shrink-0">
                <card.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground truncate">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Creator / Influencer Dashboard ──────────────────────────
function ContentView({ myStats, navigate, roleLabel }: { myStats: any; navigate: any; roleLabel: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Earned</p>
            <p className="text-3xl font-bold text-foreground mt-1">{fmt(myStats?.my_total_earned_cents ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-bold text-foreground mt-1">{fmt(myStats?.my_pending_cents ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: DollarSign, title: "Commissions", desc: "View earnings", to: "/commissions" },
          { icon: BookOpen, title: "Quick Start", desc: "Get started guide", to: "/learning" },
          { icon: CalendarDays, title: "Hub Booking", desc: "Schedule hub time", to: "/hub" },
        ].map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border active:scale-[0.98]"
            onClick={() => navigate(card.to)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted shrink-0">
                <card.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground truncate">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function AgencyDashboard() {
  const navigate = useNavigate();
  const { isAgencyAdmin, isAgencyManager, isFootSoldier, isFinanceOfficer, isCreator, isInfluencer, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: dash, isLoading: dashLoading } = useAgencyDashboard(isLeader || isFinanceOfficer ? agencyId : undefined);
  const { data: myStats, isLoading: myLoading } = useMyAgencyStats(agencyId);

  if (ctxLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <h2 className="text-lg font-semibold text-foreground">No Agency Found</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You are not assigned to any agency. Contact your administrator.
        </p>
      </div>
    );
  }

  const agencyName = (ctx as any)?.agencies?.name ?? "Agency";
  const agencySlug = (ctx as any)?.agencies?.slug ?? "";
  const loading = dashLoading || myLoading;

  let subtitle: string;
  if (isLeader) subtitle = "Agency-wide operations overview";
  else if (isFinanceOfficer) subtitle = "Financial overview and commission tracking";
  else if (isCreator) subtitle = "Content and earnings overview";
  else if (isInfluencer) subtitle = "Campaign and earnings overview";
  else subtitle = "Your onboarding tools and performance";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">{agencyName} Dashboard</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">{subtitle}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <>
          {isLeader && <LeaderView dash={dash} navigate={navigate} />}
          {isFinanceOfficer && !isLeader && <FinanceView dash={dash} navigate={navigate} />}
          {(isFootSoldier && !isLeader && !isFinanceOfficer) && <FootSoldierView agencySlug={agencySlug} myStats={myStats} />}
          {(isCreator || isInfluencer) && !isLeader && !isFinanceOfficer && !isFootSoldier && (
            <ContentView myStats={myStats} navigate={navigate} roleLabel={isCreator ? "Creator" : "Influencer"} />
          )}
        </>
      )}
    </div>
  );
}
