import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  disbursed: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export function PayoutQueuePanel() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["manage-payouts", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("payout_requests" as any)
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 10_000,
    retry: 1,
  });

  const updatePayout = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updates: any = { status };
      if (status === "approved") updates.approved_at = new Date().toISOString();
      if (status === "disbursed") updates.disbursed_at = new Date().toISOString();
      if (reason) updates.rejection_reason = reason;
      const { error } = await supabase
        .from("payout_requests" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-payouts"] });
      toast.success("Payout updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPending = payouts.filter((p: any) => p.status === "pending")
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Payout Queue</h3>
          {totalPending > 0 && (
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              ${(totalPending / 100).toFixed(2)} pending
            </Badge>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : payouts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No payout requests found</p>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Agency</TableHead>
                <TableHead className="text-xs">Member</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Requested</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {p.agency_id?.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {p.member_user_id?.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground">
                    ${(p.amount_cents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[p.status] || ""}`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.requested_at ? format(new Date(p.requested_at), "MMM d, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    {p.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-green-500 hover:text-green-600"
                          onClick={() => updatePayout.mutate({ id: p.id, status: "approved" })}
                          disabled={updatePayout.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive/80"
                          onClick={() => updatePayout.mutate({ id: p.id, status: "rejected", reason: "Manual rejection" })}
                          disabled={updatePayout.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                    {p.status === "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-blue-500"
                        onClick={() => updatePayout.mutate({ id: p.id, status: "disbursed" })}
                        disabled={updatePayout.isPending}
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />Disburse
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminGlassCard>
  );
}
