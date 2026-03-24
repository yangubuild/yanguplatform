import { useState, useEffect, useCallback } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { useUserFullLifecycle, useUserModerationAction } from "@/hooks/manage/useManageUserLifecycle";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Users, UserCheck, UserX, Clock, ShieldAlert,
  RotateCcw, MoreHorizontal, Copy, Mail, MailCheck, Bell,
  Eye, Shield, ShieldOff, CheckCircle2,
} from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
interface LifecycleUser {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  creator_type: string | null;
  country: string | null;
  business_name: string | null;
  onboarding_completed: boolean;
  account_status: string;
  email_verified_at: string | null;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  onboarding_step: string | null;
  welcome_email_sent_at: string | null;
  last_onboarding_reminder_sent_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  auth_provider: string | null;
  roles?: { role: string }[] | null;
}

interface LifecycleStats {
  total: number;
  registered: number;
  verified_pending_onboarding: number;
  onboarding_in_progress: number;
  active: number;
  suspended: number;
  welcome_not_sent: number;
  reminder_eligible: number;
}

type FilterKey = "all" | "verified_not_onboarded" | "onboarding_in_progress" | "active" | "suspended" | "welcome_not_sent" | "reminder_eligible";

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "verified_not_onboarded", label: "Verified, Not Onboarded" },
  { value: "onboarding_in_progress", label: "Onboarding In Progress" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "welcome_not_sent", label: "Welcome Email Not Sent" },
  { value: "reminder_eligible", label: "Reminder Eligible" },
];

const statusColor: Record<string, string> = {
  registered: "bg-muted text-muted-foreground border-border",
  verified_pending_onboarding: "bg-warning/15 text-warning border-warning/20",
  onboarding_in_progress: "bg-accent/15 text-accent border-accent/20",
  active: "bg-success/15 text-success border-success/20",
  suspended: "bg-destructive/15 text-destructive border-destructive/20",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Columns ────────────────────────────────────────────────
function buildColumns(onAction: (user: LifecycleUser, action: string) => void): AdminColumn<LifecycleUser>[] {
  return [
    {
      key: "email",
      header: "Email",
      render: (r) => <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{r.email || "—"}</span>,
    },
    {
      key: "username",
      header: "Name",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">
            {r.username ? `@${r.username}` : <span className="text-muted-foreground italic">—</span>}
          </span>
          {r.display_name && <span className="text-xs text-muted-foreground">{r.display_name}</span>}
        </div>
      ),
    },
    {
      key: "email_verified",
      header: "Email Verified",
      render: (r) => r.email_verified_at
        ? <CheckCircle2 className="h-4 w-4 text-success" />
        : <span className="text-xs text-muted-foreground">No</span>,
    },
    {
      key: "onboarding_step",
      header: "Onboarding Step",
      render: (r) => r.onboarding_step
        ? <Badge variant="outline" className="text-[10px]">{r.onboarding_step}</Badge>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: "account_status",
      header: "Status",
      render: (r) => (
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor[r.account_status] ?? statusColor.registered}`}>
          {r.account_status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
    {
      key: "last_sign_in_at",
      header: "Last Sign In",
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.last_sign_in_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAction(r, "view")}>
              <Eye className="h-3.5 w-3.5 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction(r, "copy_id")}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy User ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction(r, "copy_email")}>
              <Mail className="h-3.5 w-3.5 mr-2" /> Copy Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {r.account_status === "active" && !r.welcome_email_sent_at && (
              <DropdownMenuItem onClick={() => onAction(r, "mark_welcome_sent")}>
                <MailCheck className="h-3.5 w-3.5 mr-2" /> Mark Welcome Sent
              </DropdownMenuItem>
            )}
            {["verified_pending_onboarding", "onboarding_in_progress"].includes(r.account_status) && (
              <DropdownMenuItem onClick={() => onAction(r, "mark_reminder_sent")}>
                <Bell className="h-3.5 w-3.5 mr-2" /> Mark Reminder Sent
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {r.account_status !== "suspended" ? (
              <DropdownMenuItem onClick={() => onAction(r, "suspend")} className="text-destructive">
                <Shield className="h-3.5 w-3.5 mr-2" /> Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAction(r, "unsuspend")}>
                <ShieldOff className="h-3.5 w-3.5 mr-2" /> Unsuspend
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

// ── User Detail Drawer (Full Lifecycle) ────────────────────
function UserDetailDrawer({
  user, open, onClose, onAction,
}: { user: LifecycleUser | null; open: boolean; onClose: () => void; onAction: (user: LifecycleUser, action: string) => void }) {
  const { data: lifecycle, isLoading: lcLoading } = useUserFullLifecycle(user?.id ?? null);
  const modAction = useUserModerationAction();

  if (!user) return null;

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Auth User ID", value: <code className="text-xs bg-muted px-1.5 py-0.5 rounded select-all">{user.id}</code> },
    { label: "Email", value: user.email },
    { label: "Provider", value: user.auth_provider || "email" },
    { label: "Created", value: formatDateTime(user.created_at) },
    { label: "Last Sign In", value: formatDateTime(user.last_sign_in_at) },
    { label: "Email Verified", value: formatDateTime(user.email_verified_at) },
    { label: "Onboarding Started", value: formatDateTime(user.onboarding_started_at) },
    { label: "Onboarding Completed", value: formatDateTime(user.onboarding_completed_at) },
    { label: "Current Step", value: user.onboarding_step || "—" },
    { label: "Account Status", value: (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor[user.account_status] ?? statusColor.registered}`}>
        {user.account_status.replace(/_/g, " ")}
      </span>
    )},
    { label: "Welcome Email Sent", value: user.welcome_email_sent_at ? formatDateTime(user.welcome_email_sent_at) : "Not sent" },
    { label: "Last Reminder Sent", value: user.last_onboarding_reminder_sent_at ? formatDateTime(user.last_onboarding_reminder_sent_at) : "Never" },
    { label: "Country", value: user.country || "—" },
    { label: "Business Name", value: user.business_name || "—" },
    { label: "Creator Type", value: user.creator_type || "—" },
  ];

  const handleMod = (action: "suspend" | "reactivate" | "reset_onboarding") => {
    modAction.mutate({ userId: user.id, action }, {
      onSuccess: () => { toast.success(`Action "${action.replace(/_/g, " ")}" completed`); onClose(); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {user.display_name || user.username || user.email}
          </SheetTitle>
          <SheetDescription>Full user lifecycle</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-start gap-4 py-2 border-b border-border/40">
              <span className="text-xs text-muted-foreground shrink-0">{f.label}</span>
              <span className="text-sm text-foreground text-right">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Lifecycle data */}
        {lcLoading ? (
          <div className="mt-4 text-xs text-muted-foreground">Loading lifecycle…</div>
        ) : lifecycle && (
          <div className="mt-6 space-y-4">
            {/* KYC */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">KYC Status</h4>
              {lifecycle.kyc ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Status: <span className="font-medium text-foreground">{lifecycle.kyc.status}</span></p>
                  <p>Provider: {lifecycle.kyc.provider || "—"}</p>
                  <p>Created: {formatDateTime(lifecycle.kyc.created_at)}</p>
                </div>
              ) : <p className="text-xs text-muted-foreground">No KYC record</p>}
            </div>

            {/* Subscription */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">Subscription</h4>
              {lifecycle.subscription ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Plan: <span className="font-medium text-foreground">{lifecycle.subscription.plan_id}</span></p>
                  <p>Status: <span className="font-medium text-foreground">{lifecycle.subscription.status}</span></p>
                  <p>Provider: {lifecycle.subscription.provider}</p>
                </div>
              ) : <p className="text-xs text-muted-foreground">No subscription</p>}
            </div>

            {/* Activity */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">Activity</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <p>Surfaces: <span className="font-medium text-foreground">{lifecycle.surfaces_count}</span></p>
                <p>AI Images: <span className="font-medium text-foreground">{lifecycle.ai_images_count}</span></p>
                <p>AI Videos: <span className="font-medium text-foreground">{lifecycle.ai_videos_count}</span></p>
                <p>Tickets: <span className="font-medium text-foreground">{lifecycle.support_tickets_count}</span></p>
              </div>
            </div>

            {/* Roles */}
            {lifecycle.roles && lifecycle.roles.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">Roles</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {lifecycle.roles.map((r: string) => (
                    <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Audit */}
            {lifecycle.recent_audit && lifecycle.recent_audit.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">Recent Activity</h4>
                <div className="space-y-1">
                  {lifecycle.recent_audit.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{a.action} ({a.entity_type})</span>
                      <span>{formatDate(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <h4 className="text-xs font-semibold text-foreground mb-2">Moderation Actions</h4>
          <div className="flex gap-2 flex-wrap">
            {user.account_status !== "suspended" ? (
              <Button size="sm" variant="destructive" onClick={() => handleMod("suspend")} disabled={modAction.isPending}>
                <Shield className="h-3.5 w-3.5 mr-1" /> Suspend
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleMod("reactivate")} disabled={modAction.isPending}>
                <ShieldOff className="h-3.5 w-3.5 mr-1" /> Reactivate
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleMod("reset_onboarding")} disabled={modAction.isPending}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Onboarding
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Admin Reset Tool ──────────────────────────────────────
function AdminResetTool() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc("admin_reset_user_onboarding", { p_email: trimmed });
      if (error) throw error;
      toast.success("User reset successfully. Next login will start onboarding.");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGlassCard className="border-[hsl(0,72%,51%/0.3)]">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-5 w-5 text-[hsl(0,72%,51%)]" />
        <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] font-display">
          Reset User Onboarding (Admin Only)
        </h3>
      </div>
      <p className="text-xs text-[hsl(var(--admin-text-muted))] mb-3">
        Enter a user's email to wipe their onboarding state. They will restart onboarding on next login.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[hsl(var(--admin-surface-elevated)/0.4)] border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))]"
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />
        <Button onClick={handleReset} disabled={loading || !email.trim()} variant="destructive" className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
          Reset
        </Button>
      </div>
    </AdminGlassCard>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { isAdmin } = useRoles();
  const [users, setUsers] = useState<LifecycleUser[]>([]);
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailUser, setDetailUser] = useState<LifecycleUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        supabase.rpc("manage_list_users_lifecycle", {
          p_filter: filter,
          p_limit: 200,
          p_offset: 0,
        } as any),
        supabase.rpc("manage_user_lifecycle_stats" as any),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (statsRes.error) throw statsRes.error;

      setUsers((usersRes.data as any as LifecycleUser[]) || []);
      setStats(statsRes.data as any as LifecycleStats);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (user: LifecycleUser, action: string) => {
    switch (action) {
      case "view": {
        // Fetch full detail
        try {
          const { data, error } = await supabase.rpc("manage_get_user_detail" as any, { p_user_id: user.id });
          if (error) throw error;
          setDetailUser(data as any as LifecycleUser);
          setDrawerOpen(true);
        } catch (err) {
          console.error(err);
          // Fallback to list data
          setDetailUser(user);
          setDrawerOpen(true);
        }
        break;
      }
      case "copy_id":
        await navigator.clipboard.writeText(user.id);
        toast.success("User ID copied");
        break;
      case "copy_email":
        await navigator.clipboard.writeText(user.email);
        toast.success("Email copied");
        break;
      case "suspend":
      case "unsuspend":
      case "mark_welcome_sent":
      case "mark_reminder_sent": {
        try {
          const { error } = await supabase.rpc("manage_update_user_lifecycle" as any, {
            p_user_id: user.id,
            p_action: action,
          });
          if (error) throw error;
          toast.success(`Action "${action.replace(/_/g, " ")}" completed`);
          fetchData();
        } catch (err: any) {
          toast.error(err?.message || "Action failed");
        }
        break;
      }
    }
  };

  const columns = buildColumns(handleAction);

  const filtered = users.filter(
    (u) =>
      (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.business_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Lifecycle"
        description="Track users from signup through onboarding to active status"
      />

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <AdminMetricCard label="Total Users" value={stats.total} icon={<Users className="h-4 w-4" />} />
          <AdminMetricCard label="Verified Pending" value={stats.verified_pending_onboarding} icon={<Clock className="h-4 w-4" />} />
          <AdminMetricCard label="Onboarding" value={stats.onboarding_in_progress} icon={<Clock className="h-4 w-4" />} />
          <AdminMetricCard label="Active" value={stats.active} icon={<UserCheck className="h-4 w-4" />} />
          <AdminMetricCard label="Suspended" value={stats.suspended} icon={<UserX className="h-4 w-4" />} />
        </div>
      )}

      {/* Toolbar with filter */}
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, email, or business…"
        left={
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <SelectTrigger className="w-[220px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      )}

      {/* Admin Reset Tool */}
      {isAdmin && (
        <div className="pt-6 border-t border-[hsl(var(--admin-border)/0.2)]">
          <AdminResetTool />
        </div>
      )}

      {/* User Detail Drawer */}
      <UserDetailDrawer user={detailUser} open={drawerOpen} onClose={() => { setDrawerOpen(false); fetchData(); }} onAction={handleAction} />
    </div>
  );
}
