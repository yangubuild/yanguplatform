import { Settings, ToggleLeft, ToggleRight, Gauge, Loader2, Construction } from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFeatureFlags,
  useToggleFeatureFlag,
  useQuotaConfigs,
  type FeatureFlag,
  type QuotaConfig,
} from "@/hooks/manage/useManageSettings";
import { toast } from "sonner";

function humanize(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Feature Flags ─────────────────────────────────── */
function FeatureFlagsSection() {
  const { data: flags, isLoading } = useFeatureFlags();
  const toggleMut = useToggleFeatureFlag();

  const handleToggle = (flag: FeatureFlag) => {
    toggleMut.mutate(
      { key: flag.key, enabled: !flag.enabled },
      {
        onSuccess: () => toast.success(`${humanize(flag.key)} ${!flag.enabled ? "enabled" : "disabled"}`),
        onError: (e) => toast.error("Failed: " + (e as Error).message),
      },
    );
  };

  if (isLoading) {
    return <AdminGlassCard><Skeleton className="h-24 w-full" /></AdminGlassCard>;
  }

  return (
    <AdminGlassCard>
      <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 flex items-center gap-2">
        <ToggleRight className="h-4 w-4 text-[hsl(24,95%,53%)]" />
        Feature Flags
      </h3>
      {!flags || flags.length === 0 ? (
        <p className="text-xs text-[hsl(var(--admin-text-muted))]">No feature flags configured</p>
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--admin-border)/0.3)] px-4 py-3">
              <div>
                <p className="text-sm text-[hsl(var(--admin-text))]">{humanize(flag.key)}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))] font-mono">{flag.key}</p>
              </div>
              <button
                onClick={() => handleToggle(flag)}
                disabled={toggleMut.isPending}
                className="flex items-center gap-2 text-sm disabled:opacity-50">
                {flag.enabled ? (
                  <ToggleRight className="h-6 w-6 text-[hsl(160,84%,45%)]" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-[hsl(var(--admin-text-muted))]" />
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    flag.enabled
                      ? "border-[hsl(160,84%,45%/0.3)] text-[hsl(160,84%,45%)]"
                      : "border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))]"
                  }`}>
                  {flag.enabled ? "On" : "Off"}
                </Badge>
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminGlassCard>
  );
}

/* ── Usage Quota Config ────────────────────────────── */
function QuotaConfigSection() {
  const { data: quotas, isLoading } = useQuotaConfigs();

  if (isLoading) {
    return <AdminGlassCard><Skeleton className="h-24 w-full" /></AdminGlassCard>;
  }

  return (
    <AdminGlassCard>
      <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-[hsl(24,95%,53%)]" />
        Usage Quotas
      </h3>
      {!quotas || quotas.length === 0 ? (
        <p className="text-xs text-[hsl(var(--admin-text-muted))]">No quota configs found</p>
      ) : (
        <div className="rounded-xl border border-[hsl(var(--admin-border)/0.3)] overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_80px_60px_60px] gap-0 text-[10px] uppercase tracking-wider text-[hsl(var(--admin-text-muted))] px-4 py-2 border-b border-[hsl(var(--admin-border)/0.2)]">
            <span>Quota</span>
            <span className="text-center">Free</span>
            <span className="text-center">Starter</span>
            <span className="text-center">Creator</span>
            <span className="text-center">Reset</span>
            <span className="text-center">Active</span>
          </div>
          {quotas.map((q) => (
            <div
              key={q.key}
              className="grid grid-cols-[1fr_80px_80px_80px_60px_60px] gap-0 items-center px-4 py-3 border-b border-[hsl(var(--admin-border)/0.15)] last:border-0 hover:bg-[hsl(var(--admin-surface-elevated)/0.2)]">
              <div>
                <p className="text-sm text-[hsl(var(--admin-text))]">{humanize(q.key)}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))] font-mono">{q.key}</p>
              </div>
              <span className="text-center text-sm text-[hsl(var(--admin-text))]">{q.free_limit}</span>
              <span className="text-center text-sm text-[hsl(var(--admin-text))]">{q.starter_limit ?? "—"}</span>
              <span className="text-center text-sm text-[hsl(var(--admin-text))]">{q.creator_limit ?? "—"}</span>
              <span className="text-center text-xs text-[hsl(var(--admin-text-muted))]">{q.reset_days}d</span>
              <span className="flex justify-center">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    q.is_enabled
                      ? "border-[hsl(160,84%,45%/0.3)] text-[hsl(160,84%,45%)]"
                      : "border-[hsl(0,72%,51%/0.3)] text-[hsl(0,72%,51%)]"
                  }`}>
                  {q.is_enabled ? "On" : "Off"}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </AdminGlassCard>
  );
}

/* ── Placeholder sections ──────────────────────────── */
function PlaceholderSection({ title }: { title: string }) {
  return (
    <AdminGlassCard>
      <div className="flex items-center gap-3 py-4">
        <div className="p-2 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.5)]">
          <Construction className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[hsl(var(--admin-text))]">{title}</p>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Coming in next pass</p>
        </div>
      </div>
    </AdminGlassCard>
  );
}

/* ── Main Page ─────────────────────────────────────── */
export default function ManageSettings() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Platform Settings"
        description="Feature flags, usage quotas, and platform configuration"
      />
      <FeatureFlagsSection />
      <QuotaConfigSection />
      <PlaceholderSection title="Email & Notification Settings" />
      <PlaceholderSection title="Auth & Security Configuration" />
      <PlaceholderSection title="Billing & Payment Settings" />
    </div>
  );
}
