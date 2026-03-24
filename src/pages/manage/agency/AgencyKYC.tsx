import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useAgencyReferrals } from "@/hooks/manage/useAgencyReferrals";
import { useRoles } from "@/hooks/useRoles";

const KYC_BADGE: Record<string, string> = {
  verified: "bg-green-500/10 text-green-600 border-green-500/20",
  pending_review: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  not_started: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export default function AgencyKYC() {
  const { isAgencyAdmin, isAdmin } = useRoles();
  const { data: ctx, isLoading: ctxLoading } = useAgencyContext();
  const agencyId = ctx?.agency_id;
  const { data: referrals, isLoading } = useAgencyReferrals(agencyId);

  if (!isAdmin && !isAgencyAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">KYC status overview is available for agency admins only.</p>
      </div>
    );
  }

  if (ctxLoading || isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  }

  const grouped = {
    verified: referrals?.filter((r) => r.kyc_status === "verified") ?? [],
    pending_review: referrals?.filter((r) => r.kyc_status === "pending_review") ?? [],
    rejected: referrals?.filter((r) => r.kyc_status === "rejected") ?? [],
    not_started: referrals?.filter((r) => r.kyc_status === "not_started" || r.kyc_status === "in_progress") ?? [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">KYC Status</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Verification overview for all referred users</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verified", count: grouped.verified.length, color: "text-green-600" },
          { label: "Pending Review", count: grouped.pending_review.length, color: "text-yellow-600" },
          { label: "Rejected", count: grouped.rejected.length, color: "text-red-600" },
          { label: "Not Started", count: grouped.not_started.length, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Foot Soldier</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Referred Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(referrals?.length ?? 0) === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No referrals</td></tr>
              ) : (
                referrals!.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.referred_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.soldier_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${KYC_BADGE[r.kyc_status] ?? ""}`}>
                        {r.kyc_status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{r.source}</Badge></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
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
