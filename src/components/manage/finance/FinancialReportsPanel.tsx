import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";

function useFinancialStats() {
  return useQuery({
    queryKey: ["manage", "financial-stats"],
    queryFn: async () => {
      // Active subscriptions count
      const { count: activeSubs } = await supabase
        .from("billing_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Total commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("amount_cents, status")
        .limit(1000);

      const totalCommissions = (commissions ?? []).reduce((sum: number, c: any) => sum + (c.amount_cents || 0), 0);
      const pendingCommissions = (commissions ?? []).filter((c: any) => c.status === "pending")
        .reduce((sum: number, c: any) => sum + (c.amount_cents || 0), 0);

      // Total profiles for ARPU
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Payout totals
      const { data: payouts } = await supabase
        .from("payout_requests")
        .select("amount_cents, status")
        .limit(1000);

      const disbursedPayouts = (payouts ?? []).filter((p: any) => p.status === "disbursed")
        .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

      return {
        activeSubs: activeSubs ?? 0,
        totalCommissionsCents: totalCommissions,
        pendingCommissionsCents: pendingCommissions,
        totalUsers: totalUsers ?? 0,
        disbursedPayoutsCents: disbursedPayouts,
      };
    },
    staleTime: 30_000,
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function FinancialReportsPanel() {
  const { data: stats, isLoading } = useFinancialStats();

  const metrics = [
    { label: "Active Subscriptions", value: stats ? String(stats.activeSubs) : "—", isPositive: true },
    { label: "Total Commissions", value: stats ? formatCents(stats.totalCommissionsCents) : "—", isPositive: true },
    { label: "Pending Commissions", value: stats ? formatCents(stats.pendingCommissionsCents) : "—", isPositive: false },
    { label: "Disbursed Payouts", value: stats ? formatCents(stats.disbursedPayoutsCents) : "—", isPositive: true },
  ];

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Financial Reports</h3>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Download className="h-3.5 w-3.5 mr-1" />Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {metrics.map(metric => (
            <div key={metric.label} className="rounded-lg border border-border bg-card/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-lg font-bold text-foreground">{metric.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Quick Stats</h4>
        <div className="flex items-center justify-between py-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground">Total Registered Users</span>
          </div>
          <Badge variant="outline" className="text-xs">{stats?.totalUsers ?? "—"}</Badge>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground">ARPU</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats && stats.totalUsers > 0
              ? formatCents(Math.round(stats.totalCommissionsCents / stats.totalUsers))
              : "—"}
          </Badge>
        </div>
      </div>
    </AdminGlassCard>
  );
}
