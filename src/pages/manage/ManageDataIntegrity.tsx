import {
  ShieldCheck, AlertTriangle, Database, RefreshCw,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDataIntegrityCheck } from "@/hooks/manage/useManageDataIntegrity";

export default function ManageDataIntegrity() {
  const { data, isLoading, refetch, isFetching } = useDataIntegrityCheck();

  const checks = data ? [
    { label: "Duplicate Emails", value: data.duplicate_emails, ok: data.duplicate_emails === 0 },
    { label: "Orphan Subscriptions", value: data.orphan_subscriptions, ok: data.orphan_subscriptions === 0 },
    { label: "Invalid Subscriptions", value: data.invalid_subscriptions, ok: data.invalid_subscriptions === 0 },
    { label: "KYC Without Profile", value: data.kyc_without_profile, ok: data.kyc_without_profile === 0 },
    { label: "Referrals Without Agency", value: data.referrals_without_agency, ok: data.referrals_without_agency === 0 },
  ] : [];

  const allHealthy = checks.every((c) => c.ok);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <AdminPageHeader title="Data Integrity" description="Check for duplicates, orphans, and invalid records" />
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}
          className="gap-1.5 text-xs border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Run Check
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <AdminGlassCard className={`p-4 ${allHealthy ? "border-[hsl(160,84%,45%/0.3)]" : "border-destructive/30"}`}>
            <div className="flex items-center gap-3">
              {allHealthy ? (
                <ShieldCheck className="h-6 w-6 text-[hsl(160,84%,45%)]" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">
                  {allHealthy ? "All checks passed" : "Issues detected"}
                </p>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                  {checks.filter((c) => !c.ok).length} issue(s) found
                </p>
              </div>
            </div>
          </AdminGlassCard>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {checks.map((c) => (
              <AdminMetricCard
                key={c.label}
                icon={<Database className={`h-4 w-4 ${c.ok ? "text-[hsl(160,84%,45%)]" : "text-destructive"}`} />}
                label={c.label}
                value={c.value}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
