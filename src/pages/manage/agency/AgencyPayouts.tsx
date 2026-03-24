import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ArrowUpRight } from "lucide-react";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyPayouts, useRequestPayout } from "@/hooks/manage/useAgencyPayouts";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  disbursed: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function AgencyPayouts() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { user } = useAuth();
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: payouts, isLoading } = useAgencyPayouts(
    agencyId,
    isLeader ? undefined : user?.id
  );
  const requestPayout = useRequestPayout(agencyId);
  const [requestAmount, setRequestAmount] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  if (ctxLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const payable = payouts?.payable_cents ?? 0;
  const disbursed = payouts?.disbursed_cents ?? 0;
  const pendingReqs = payouts?.pending_request_cents ?? 0;
  const requests = payouts?.requests ?? [];

  const handleRequest = async () => {
    const dollars = parseFloat(requestAmount);
    if (!dollars || dollars <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents > payable) {
      toast.error("Amount exceeds available balance");
      return;
    }
    await requestPayout.mutateAsync(cents);
    setRequestAmount("");
    setShowRequest(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Payouts</h1>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Payout requests and disbursement history</p>
        </div>
        <Button size="sm" onClick={() => setShowRequest(!showRequest)} disabled={payable <= 0}>
          <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" /> Request Payout
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(payable)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(pendingReqs)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Disbursed</p>
            <p className="text-2xl font-bold text-foreground mt-1">{fmt(disbursed)}</p>
          </CardContent>
        </Card>
      </div>

      {showRequest && (
        <Card className="border border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Request Payout</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Amount in USD"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="pl-9"
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleRequest} disabled={requestPayout.isPending}>
                  {requestPayout.isPending ? "Submitting..." : "Submit Request"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Maximum: {fmt(payable)} · Requests are reviewed before disbursement</p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Payout History</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3 hidden sm:table-cell">Disbursed</th>
                <th className="px-4 py-3 hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No payout requests yet</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{fmt(r.amount_cents)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.requested_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {r.disbursed_at ? new Date(r.disbursed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{r.notes ?? "—"}</td>
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
