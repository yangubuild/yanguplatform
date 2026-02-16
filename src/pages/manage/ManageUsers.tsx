import { useState, useEffect } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, RotateCcw, Loader2, ShieldAlert } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RealUser {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  creator_type: string | null;
  country: string | null;
  business_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

const creatorColor: Record<string, string> = {
  seller: "bg-accent/10 text-accent border-accent/20",
  builder: "bg-primary/10 text-primary border-primary/20",
  organization: "bg-success/10 text-success border-success/20",
};

const columns: AdminColumn<RealUser>[] = [
  {
    key: "username",
    header: "Username",
    render: (r) => (
      <span className="font-medium text-foreground">
        {r.username ? `@${r.username}` : <span className="text-muted-foreground italic">—</span>}
      </span>
    ),
  },
  {
    key: "display_name",
    header: "Display Name",
    render: (r) => <span className="text-muted-foreground text-xs">{r.display_name || "—"}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (r) => <span className="text-muted-foreground text-xs">{r.email}</span>,
  },
  {
    key: "creator_type",
    header: "Type",
    render: (r) => r.creator_type ? (
      <Badge variant="outline" className={`text-[10px] ${creatorColor[r.creator_type] ?? "bg-muted text-muted-foreground border-border"}`}>
        {r.creator_type}
      </Badge>
    ) : <span className="text-muted-foreground text-xs">—</span>,
  },
  {
    key: "country",
    header: "Country",
    render: (r) => <span className="text-xs text-muted-foreground">{r.country || "—"}</span>,
  },
  {
    key: "business_name",
    header: "Business",
    render: (r) => <span className="text-xs text-muted-foreground">{r.business_name || "—"}</span>,
  },
  {
    key: "onboarding_completed",
    header: "Onboarded",
    render: (r) => <AdminStatusBadge status={r.onboarding_completed ? "active" : "pending"} />,
  },
  {
    key: "created_at",
    header: "Joined",
    render: (r) => {
      const d = new Date(r.created_at);
      return <span className="text-xs text-muted-foreground">{d.toLocaleDateString()}</span>;
    },
  },
];

/* ── Admin Reset Tool ──────────────────────────────────── */
function AdminResetTool() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("admin_reset_user_onboarding", {
        p_email: trimmed,
      });

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
        <Button
          onClick={handleReset}
          disabled={loading || !email.trim()}
          variant="destructive"
          className="shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
          Reset
        </Button>
      </div>
    </AdminGlassCard>
  );
}

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const { isAdmin } = useRoles();
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, creator_type, country, business_name, onboarding_completed, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;

        // Fetch emails from auth via admin RPC or fall back
        // Since we can't query auth.users directly, we'll show profile data
        const mapped: RealUser[] = (data || []).map((p: any) => ({
          id: p.id,
          email: "", // Will be filled if we can get it
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          creator_type: p.creator_type,
          country: p.country,
          business_name: p.business_name,
          onboarding_completed: p.onboarding_completed ?? false,
          created_at: p.created_at,
        }));

        setUsers(mapped);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.business_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, username, or business…"
        showFilter
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AdminTable columns={columns} data={filtered} rowKey={(r) => r.id} />
      )}

      {isAdmin && (
        <div className="pt-6 border-t border-[hsl(var(--admin-border)/0.2)]">
          <AdminResetTool />
        </div>
      )}
    </div>
  );
}
