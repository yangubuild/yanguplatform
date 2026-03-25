import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export function ApprovalWorkflowPanel() {
  const qc = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["approval-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  const approveRequest = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const request = requests.find(r => r.id === id);
      if (!request) throw new Error("Request not found");

      if (action === "approve") {
        const currentApprovals = (request.approved_by as string[]) || [];
        if (currentApprovals.includes(user.id)) throw new Error("Already approved by you");

        const newApprovals = [...currentApprovals, user.id];
        const isFullyApproved = newApprovals.length >= 2; // Require 2+ approvals

        const { error } = await supabase
          .from("approval_requests")
          .update({
            approved_by: newApprovals,
            status: isFullyApproved ? "approved" : "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("approval_requests")
          .update({
            status: "rejected",
            rejected_by: user.id,
            rejection_reason: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-requests"] });
      toast.success("Request updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[hsl(24,95%,53%)]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Owner Approval Workflow</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-[9px] text-muted-foreground">
          Requires 2+ owner approvals
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No approval requests</p>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Approvals</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {req.request_type}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {req.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[req.status] || ""}`}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(req.approved_by as string[] || []).length}/2
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(req.created_at), "MMM d")}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <div className="flex gap-1 items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-green-500"
                          onClick={() => approveRequest.mutate({ id: req.id, action: "approve" })}
                          disabled={approveRequest.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive"
                          onClick={() => approveRequest.mutate({
                            id: req.id,
                            action: "reject",
                            reason: rejectionReason[req.id],
                          })}
                          disabled={approveRequest.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                    {req.status === "rejected" && req.rejection_reason && (
                      <span className="text-[10px] text-destructive">{req.rejection_reason}</span>
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
