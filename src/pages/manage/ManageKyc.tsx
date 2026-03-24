import { useState } from "react";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield, ShieldCheck, ShieldX, Clock, Eye, MoreHorizontal,
  RotateCcw, UserX, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { useManageKyc, useKycUpdateStatus, type KycItem } from "@/hooks/manage/useManageKyc";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageKyc() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<KycItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useManageKyc(filter === "all" ? null : filter);
  const updateStatus = useKycUpdateStatus();

  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 };

  const handleAction = (item: KycItem, action: string) => {
    if (action === "view") {
      setSelected(item);
      return;
    }
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      retry: "pending",
      flag: "rejected",
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    updateStatus.mutate(
      {
        verificationId: item.id,
        newStatus,
        reason: action === "flag" ? "Flagged as suspicious by admin" : action === "reject" ? "Rejected by admin" : undefined,
      },
      {
        onSuccess: () => toast.success(`KYC ${action}d successfully`),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const columns: AdminColumn<KycItem>[] = [
    {
      key: "email",
      header: "User",
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{r.username ? `@${r.username}` : "—"}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{r.email ?? "—"}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "submitted_at", header: "Submitted", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.submitted_at)}</span> },
    { key: "reviewed_at", header: "Reviewed", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.reviewed_at)}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction(r, "view")}><Eye className="mr-2 h-3.5 w-3.5" />View Details</DropdownMenuItem>
            {r.status !== "approved" && (
              <DropdownMenuItem onClick={() => handleAction(r, "approve")}><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-success" />Approve</DropdownMenuItem>
            )}
            {r.status !== "rejected" && (
              <DropdownMenuItem onClick={() => handleAction(r, "reject")}><XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />Reject</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleAction(r, "retry")}><RotateCcw className="mr-2 h-3.5 w-3.5" />Re-trigger Verification</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction(r, "flag")} className="text-destructive"><UserX className="mr-2 h-3.5 w-3.5" />Flag Suspicious</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <AdminMetricCard icon={<Shield className="h-4 w-4" />} label="Total" value={stats.total} />
        <AdminMetricCard icon={<Clock className="h-4 w-4" />} label="Pending" value={stats.pending} />
        <AdminMetricCard icon={<Loader2 className="h-4 w-4" />} label="Submitted" value={stats.submitted} />
        <AdminMetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Approved" value={stats.approved} />
        <AdminMetricCard icon={<ShieldX className="h-4 w-4" />} label="Rejected" value={stats.rejected} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <AdminTable columns={columns} data={items} loading={isLoading} rowKey={(r) => r.id} />

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>KYC Verification Detail</SheetTitle>
            <SheetDescription>{selected?.email ?? "—"}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Status</p><AdminStatusBadge status={selected.status} /></div>
                <div><p className="text-muted-foreground text-xs">User</p><p className="font-medium">{selected.username ? `@${selected.username}` : selected.display_name ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Submitted</p><p>{formatDate(selected.submitted_at)}</p></div>
                <div><p className="text-muted-foreground text-xs">Reviewed</p><p>{formatDate(selected.reviewed_at)}</p></div>
              </div>
              {selected.rejection_reason && (
                <AdminGlassCard className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selected.rejection_reason}</p>
                </AdminGlassCard>
              )}
              {selected.metadata && (
                <AdminGlassCard className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Provider Metadata</p>
                  <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </AdminGlassCard>
              )}
              <div className="flex gap-2 pt-2">
                {selected.status !== "approved" && (
                  <Button size="sm" onClick={() => { handleAction(selected, "approve"); setSelected(null); }}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                  </Button>
                )}
                {selected.status !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => { handleAction(selected, "reject"); setSelected(null); }}>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => { handleAction(selected, "retry"); setSelected(null); }}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Re-trigger
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
