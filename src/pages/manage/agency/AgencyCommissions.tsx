import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyCommissions, type Commission } from "@/hooks/manage/useAgencyCommissions";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AgencyCommissions() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { user } = useAuth();
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: commissions, isLoading } = useAgencyCommissions(
    agencyId,
    isLeader ? undefined : user?.id
  );

  const [phaseFilter, setPhaseFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!commissions) return [];
    if (phaseFilter === "all") return commissions;
    return commissions.filter((c) => c.phase === phaseFilter);
  }, [commissions, phaseFilter]);

  if (ctxLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const phase1Total = commissions?.filter((c) => c.phase === "phase_1").reduce((s, c) => s + c.amount_cents, 0) ?? 0;
  const phase2Total = commissions?.filter((c) => c.phase === "phase_2").reduce((s, c) => s + c.amount_cents, 0) ?? 0;
  const totalPaid = commissions?.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount_cents, 0) ?? 0;
  const totalPending = commissions?.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount_cents, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Commissions</h1>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Track earnings from onboarding and subscriptions</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="w-4 h-4" /> Commission Rules
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3 text-xs space-y-2" side="bottom">
              <p className="font-semibold">Phase 1 — $1.00</p>
              <p>KYC verified + phone verified + profile complete + fraud check passed + active ≥ 7 days</p>
              <p className="font-semibold mt-2">Phase 2 — $4.00/month</p>
              <p>Subscription active + payment successful + recurring monthly</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Phase 1 Earnings", value: fmt(phase1Total) },
          { label: "Phase 2 Recurring", value: fmt(phase2Total) },
          { label: "Total Paid", value: fmt(totalPaid) },
          { label: "Pending Payout", value: fmt(totalPending) },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="phase_1">Phase 1</SelectItem>
            <SelectItem value="phase_2">Phase 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Triggered</th>
                <th className="px-4 py-3">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No commissions yet</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {c.phase === "phase_1" ? "Phase 1 ($1)" : "Phase 2 ($4/mo)"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{fmt(c.amount_cents)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === "paid" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.triggered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.paid_at ? new Date(c.paid_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
