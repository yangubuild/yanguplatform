import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Search, UserPlus } from "lucide-react";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyReferrals, type AgencyReferral } from "@/hooks/manage/useAgencyReferrals";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const KYC_BADGE: Record<string, string> = {
  verified: "bg-green-500/10 text-green-600 border-green-500/20",
  pending_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  not_started: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export default function AgencyOnboarding() {
  const { isAgencyAdmin, isAgencyManager, isAdmin } = useRoles();
  const isLeader = isAdmin || isAgencyAdmin || isAgencyManager;
  const { user } = useAuth();
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: referrals, isLoading } = useAgencyReferrals(
    agencyId,
    isLeader ? undefined : user?.id
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!referrals) return [];
    return referrals.filter((r) => {
      if (statusFilter !== "all" && r.kyc_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.referred_name?.toLowerCase().includes(q) ||
          r.referred_email?.toLowerCase().includes(q) ||
          r.soldier_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [referrals, search, statusFilter]);

  const agencySlug = (ctx as any)?.agencies?.slug ?? "";
  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://yangu.io/join?ref=${agencySlug}`);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
  };

  if (ctxLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const counts = {
    total: referrals?.length ?? 0,
    pending: referrals?.filter((r) => r.kyc_status === "pending_review").length ?? 0,
    approved: referrals?.filter((r) => r.kyc_status === "verified").length ?? 0,
    rejected: referrals?.filter((r) => r.kyc_status === "rejected").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Onboarding</h1>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Track referred users and KYC status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyReferralLink}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Referral Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Referred", value: counts.total },
          { label: "KYC Pending", value: counts.pending },
          { label: "KYC Approved", value: counts.approved },
          { label: "KYC Rejected", value: counts.rejected },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or soldier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Referred User</th>
                {isLeader && <th className="px-4 py-3">Foot Soldier</th>}
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3">Referral Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No referrals found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.referred_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_email ?? ""}</p>
                    </td>
                    {isLeader && <td className="px-4 py-3 text-foreground">{r.soldier_name ?? "—"}</td>}
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{r.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${KYC_BADGE[r.kyc_status] ?? ""}`}>
                        {r.kyc_status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
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
