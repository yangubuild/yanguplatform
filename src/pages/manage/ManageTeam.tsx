import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";

type InviteStatus = "pending" | "accepted" | "revoked";
type InviteRole = "admin" | "manager" | "designer" | "user" | "owner";

interface Invite {
  id: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
}

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "designer", label: "Designer" },
  { value: "user", label: "User" },
];

const statusMap: Record<InviteStatus, "active" | "pending" | "inactive"> = {
  accepted: "active",
  pending: "pending",
  revoked: "inactive",
};

const columns: AdminColumn<Invite>[] = [
  {
    key: "email",
    header: "Email",
    render: (r) => <span className="font-medium text-foreground text-sm">{r.email}</span>,
  },
  {
    key: "role",
    header: "Role",
    render: (r) => (
      <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/20 uppercase">
        {r.role}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <AdminStatusBadge status={statusMap[r.status] ?? "pending"} />,
  },
  {
    key: "created_at",
    header: "Invited",
    render: (r) => (
      <span className="text-xs text-muted-foreground">
        {new Date(r.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export default function ManageTeam() {
  const { user } = useAuth();
  const { isOwner, isAdmin } = useRoles();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("designer");
  const [sending, setSending] = useState(false);

  const canManage = isOwner || isAdmin;

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites((data ?? []).map((d: any) => ({
        id: d.id,
        email: d.email,
        role: d.role,
        status: d.status,
        invited_by: d.invited_by,
        created_at: d.created_at,
        accepted_at: d.accepted_at,
      })));
    } catch (err: any) {
      console.error("Failed to fetch invites:", err);
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleSendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !user?.id) return;

    setSending(true);
    try {
      const { error } = await supabase.rpc("send_admin_invite", {
        p_email: trimmed,
        p_role: role,
      });

      if (error) {
        if (error.message?.includes("admin_invites_unique_pending")) {
          toast.error("A pending invite already exists for this email and role");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Invite sent to ${trimmed} as ${role}`);
      setEmail("");
      fetchInvites();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      const { error } = await supabase.rpc("revoke_admin_invite", {
        p_invite_id: inviteId,
      });

      if (error) throw error;
      toast.success("Invite revoked");
      fetchInvites();
    } catch (err: any) {
      toast.error("Failed to revoke invite");
    }
  };

  // Add actions column for owners
  const allColumns: AdminColumn<Invite>[] = canManage
    ? [
        ...columns,
        {
          key: "actions",
          header: "",
          render: (r) =>
            r.status === "pending" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(r.id)}
                className="text-destructive hover:text-destructive/80 h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null,
        },
      ]
    : columns;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Team & Invites"
        description="Invite team members and manage their management panel roles."
      />

      {/* Send invite form */}
      {canManage && (
        <AdminGlassCard>
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] font-display">
              Send Invite
            </h3>
          </div>
          <p className="text-xs text-[hsl(var(--admin-text-muted))] mb-4">
            Enter the email of the person you'd like to invite. They'll receive the role automatically when they sign up or log in.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[hsl(var(--admin-surface-elevated)/0.4)] border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
            />
            <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
              <SelectTrigger className="w-full sm:w-[160px] bg-[hsl(var(--admin-surface-elevated)/0.4)] border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSendInvite}
              disabled={sending || !email.trim()}
              className="bg-[hsl(var(--admin-accent))] hover:bg-[hsl(var(--admin-accent)/0.85)] text-white shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Send Invite
            </Button>
          </div>
        </AdminGlassCard>
      )}

      {/* Invites table */}
      <AdminGlassCard>
        <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] font-display mb-4">
          All Invites
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AdminTable
            columns={allColumns}
            data={invites}
            rowKey={(r) => r.id}
            emptyMessage="No invites sent yet"
          />
        )}
      </AdminGlassCard>
    </div>
  );
}
