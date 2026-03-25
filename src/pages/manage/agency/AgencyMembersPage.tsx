import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyMembersList } from "@/hooks/manage/useAgencyMembers";
import { useRoles } from "@/hooks/useRoles";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

const ROLE_COLORS: Record<string, string> = {
  agency_admin: "bg-primary/10 text-primary border-primary/20",
  agency_manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  foot_soldier: "bg-muted text-muted-foreground border-border",
  finance_officer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  creator: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  influencer: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  agency_admin: "Agency Principal",
  agency_manager: "Sales Lead",
  foot_soldier: "Foot Soldier",
  finance_officer: "Finance Officer",
  creator: "Creator",
  influencer: "Influencer",
};

export default function AgencyMembers() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: members, isLoading } = useAgencyMembersList(isLeader ? agencyId : undefined);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!members) return [];
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter((m) => m.display_name?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q));
  }, [members, search]);

  if (ctxLoading || isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  if (!isLeader) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Foot Soldiers can only view their own stats on the Dashboard.</p>
      </div>
    );
  }

  const totalReferrals = members?.reduce((s, m) => s + m.referral_count, 0) ?? 0;
  const totalEarned = members?.reduce((s, m) => s + m.commission_total, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Foot Soldiers</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">{members?.length ?? 0} members · {totalReferrals} referrals · {fmt(totalEarned)} earned</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No members found</p>
        ) : (
          filtered.map((m) => (
            <Card key={m.id} className="border border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{m.display_name ?? m.username ?? "—"}</p>
                  <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${ROLE_COLORS[m.role] ?? ""}`}>{ROLE_LABELS[m.role] ?? m.role.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{m.referral_count} referrals</span>
                  <span>{fmt(m.commission_total)} earned</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="border border-border hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Referrals</th>
                <th className="px-4 py-3">Commissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No members found</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{m.display_name ?? m.username ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${ROLE_COLORS[m.role] ?? ""}`}>{ROLE_LABELS[m.role] ?? m.role.replace(/_/g, " ")}</Badge></td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.referral_count}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{fmt(m.commission_total)}</td>
                    <td className="px-4 py-3"><Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(m.joined_at).toLocaleDateString()}</td>
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
