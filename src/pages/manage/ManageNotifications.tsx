import { useState } from "react";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useManageNotifications, type EmailNotification } from "@/hooks/manage/useManageNotifications";

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  sent: "bg-success/15 text-success border-success/20",
  pending: "bg-warning/15 text-warning border-warning/20",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
  dlq: "bg-destructive/15 text-destructive border-destructive/20",
  bounced: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  complained: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  suppressed: "bg-muted text-muted-foreground border-border",
};

export default function ManageNotifications() {
  const [filter, setFilter] = useState<string>("all");
  const { data: emails = [], isLoading } = useManageNotifications(filter === "all" ? null : filter);

  const sentCount = emails.filter((e) => e.status === "sent").length;
  const failedCount = emails.filter((e) => ["failed", "dlq"].includes(e.status)).length;
  const pendingCount = emails.filter((e) => e.status === "pending").length;

  const columns: AdminColumn<EmailNotification>[] = [
    {
      key: "template_name",
      header: "Template",
      render: (r) => <span className="text-sm font-medium text-foreground">{r.template_name ?? "—"}</span>,
    },
    {
      key: "recipient_email",
      header: "Recipient",
      render: (r) => <span className="text-xs text-muted-foreground">{r.recipient_email ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor[r.status] ?? statusColor.pending}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "error_message",
      header: "Error",
      render: (r) => r.error_message ? (
        <span className="text-xs text-destructive max-w-[200px] truncate block">{r.error_message}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: "created_at",
      header: "Sent At",
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Notification Control" description="Monitor all outgoing emails and delivery status" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<Mail className="h-4 w-4" />} label="Total" value={emails.length} />
        <AdminMetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Sent" value={sentCount} />
        <AdminMetricCard icon={<AlertCircle className="h-4 w-4" />} label="Failed" value={failedCount} />
        <AdminMetricCard icon={<Clock className="h-4 w-4" />} label="Pending" value={pendingCount} />
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="dlq">DLQ</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="bounced">Bounced</SelectItem>
          <SelectItem value="suppressed">Suppressed</SelectItem>
        </SelectContent>
      </Select>

      <AdminTable columns={columns} data={emails} loading={isLoading} rowKey={(r) => r.id} />
    </div>
  );
}
