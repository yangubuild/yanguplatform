import { useState } from "react";
import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard, DollarSign, AlertTriangle, TrendingUp, Users,
  MoreHorizontal, XCircle, RotateCcw, CheckCircle2, Loader2,
} from "lucide-react";
import { useManagePayments, useSubscriptionAction, type Subscription, type Transaction } from "@/hooks/manage/useManagePayments";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "canceled", label: "Canceled" },
  { value: "past_due", label: "Past Due" },
  { value: "trialing", label: "Trialing" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManagePayments() {
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useManagePayments(filter === "all" ? null : filter);
  const subAction = useSubscriptionAction();

  const subscriptions = data?.subscriptions ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, canceled: 0, past_due: 0, trialing: 0 };
  const transactions = data?.recent_transactions ?? [];

  const handleSubAction = (sub: Subscription, action: "cancel" | "reactivate" | "mark_past_due") => {
    subAction.mutate(
      { subscriptionId: sub.id, action },
      {
        onSuccess: () => toast.success(`Subscription ${action}d`),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const subColumns: AdminColumn<Subscription>[] = [
    {
      key: "email",
      header: "User",
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{r.username ? `@${r.username}` : r.display_name ?? "—"}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">{r.email ?? "—"}</span>
        </div>
      ),
    },
    { key: "plan_id", header: "Plan", render: (r) => <span className="text-sm font-mono">{r.plan_id}</span> },
    { key: "provider", header: "Provider", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.provider}</span> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "current_period_end", header: "Period End", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.current_period_end)}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {r.status === "active" && (
              <DropdownMenuItem onClick={() => handleSubAction(r, "cancel")} className="text-destructive">
                <XCircle className="mr-2 h-3.5 w-3.5" />Cancel Subscription
              </DropdownMenuItem>
            )}
            {r.status === "canceled" && (
              <DropdownMenuItem onClick={() => handleSubAction(r, "reactivate")}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />Reactivate
              </DropdownMenuItem>
            )}
            {r.status === "active" && (
              <DropdownMenuItem onClick={() => handleSubAction(r, "mark_past_due")}>
                <AlertTriangle className="mr-2 h-3.5 w-3.5" />Mark Past Due
              </DropdownMenuItem>
            )}
            {r.status === "past_due" && (
              <>
                <DropdownMenuItem onClick={() => handleSubAction(r, "reactivate")}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />Retry / Reactivate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSubAction(r, "cancel")} className="text-destructive">
                  <XCircle className="mr-2 h-3.5 w-3.5" />Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const txColumns: AdminColumn<Transaction>[] = [
    {
      key: "email",
      header: "User",
      render: (r) => <span className="text-sm text-muted-foreground">{r.username ? `@${r.username}` : r.email ?? "—"}</span>,
    },
    { key: "transaction_type", header: "Type", render: (r) => <span className="text-xs font-mono capitalize">{r.transaction_type}</span> },
    { key: "amount", header: "Amount", render: (r) => <span className={`text-sm font-semibold ${r.amount >= 0 ? "text-success" : "text-destructive"}`}>{r.amount}</span> },
    { key: "balance_after", header: "Balance", render: (r) => <span className="text-sm text-muted-foreground">{r.balance_after}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{r.description ?? "—"}</span> },
    { key: "created_at", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span> },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <AdminMetricCard icon={CreditCard} label="Total" value={stats.total} />
        <AdminMetricCard icon={CheckCircle2} label="Active" value={stats.active} />
        <AdminMetricCard icon={XCircle} label="Canceled" value={stats.canceled} />
        <AdminMetricCard icon={AlertTriangle} label="Past Due" value={stats.past_due} />
        <AdminMetricCard icon={TrendingUp} label="Trialing" value={stats.trialing} />
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-3">
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
          <AdminTable columns={subColumns} data={subscriptions} loading={isLoading} rowKey={(r) => r.id} />
        </TabsContent>

        <TabsContent value="transactions">
          <AdminTable columns={txColumns} data={transactions} loading={isLoading} rowKey={(r) => r.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
