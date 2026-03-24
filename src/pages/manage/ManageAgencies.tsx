import { format } from "date-fns";
import {
  Building2, Users, UserPlus, Shield, CreditCard, DollarSign, Clock,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAgenciesOverview, type AgencyOverview } from "@/hooks/manage/useManageAgencies";

function AgencyRow({ agency }: { agency: AgencyOverview }) {
  return (
    <TableRow className="border-[hsl(var(--admin-border)/0.2)] hover:bg-[hsl(var(--admin-surface-elevated)/0.3)]">
      <TableCell>
        <div>
          <p className="text-sm font-medium text-[hsl(var(--admin-text))]">{agency.name}</p>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">/{agency.slug}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[10px] ${agency.status === "active" ? "border-[hsl(160,84%,45%/0.3)] text-[hsl(160,84%,45%)]" : "border-destructive/30 text-destructive"}`}>
          {agency.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-[hsl(var(--admin-text))]">{agency.total_members}</TableCell>
      <TableCell className="text-sm text-[hsl(var(--admin-text))]">{agency.total_referrals}</TableCell>
      <TableCell className="text-sm text-[hsl(var(--admin-text))]">{agency.kyc_completed}</TableCell>
      <TableCell className="text-sm text-[hsl(var(--admin-text))]">{agency.active_subscribers}</TableCell>
      <TableCell className="text-sm text-[hsl(var(--admin-text))]">${(agency.total_revenue_cents / 100).toFixed(2)}</TableCell>
      <TableCell className="text-sm text-orange-500 font-medium">${(agency.pending_commissions_cents / 100).toFixed(2)}</TableCell>
      <TableCell className="text-xs text-[hsl(var(--admin-text-muted))]">{format(new Date(agency.created_at), "MMM d, yyyy")}</TableCell>
    </TableRow>
  );
}

export default function ManageAgencies() {
  const { data: agencies, isLoading } = useAgenciesOverview();

  const totals = agencies?.reduce(
    (acc, a) => ({
      members: acc.members + a.total_members,
      referrals: acc.referrals + a.total_referrals,
      kyc: acc.kyc + a.kyc_completed,
      subs: acc.subs + a.active_subscribers,
      revenue: acc.revenue + a.total_revenue_cents,
      pending: acc.pending + a.pending_commissions_cents,
    }),
    { members: 0, referrals: 0, kyc: 0, subs: 0, revenue: 0, pending: 0 }
  ) ?? { members: 0, referrals: 0, kyc: 0, subs: 0, revenue: 0, pending: 0 };

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Agency Overview" description="Monitor all agencies, their performance, and commission obligations" />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AdminMetricCard icon={<Building2 className="h-4 w-4" />} label="Total Agencies" value={agencies?.length ?? 0} />
            <AdminMetricCard icon={<Users className="h-4 w-4" />} label="Total Members" value={totals.members} />
            <AdminMetricCard icon={<UserPlus className="h-4 w-4" />} label="Total Referrals" value={totals.referrals} />
            <AdminMetricCard icon={<Shield className="h-4 w-4" />} label="KYC Completed" value={totals.kyc} />
            <AdminMetricCard icon={<CreditCard className="h-4 w-4" />} label="Active Subs" value={totals.subs} />
            <AdminMetricCard icon={<DollarSign className="h-4 w-4" />} label="Pending Commissions" value={`$${(totals.pending / 100).toFixed(2)}`} />
          </div>

          <AdminGlassCard>
            {!agencies || agencies.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Building2 className="h-8 w-8 text-[hsl(var(--admin-text-muted))]" />
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">No agencies registered yet</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[hsl(var(--admin-border)/0.3)] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[hsl(var(--admin-border)/0.3)] hover:bg-transparent">
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Agency</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Status</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Members</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Referrals</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">KYC</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Subs</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Revenue</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Owed</TableHead>
                      <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agencies.map((a) => <AgencyRow key={a.id} agency={a} />)}
                  </TableBody>
                </Table>
              </div>
            )}
          </AdminGlassCard>
        </>
      )}
    </div>
  );
}
