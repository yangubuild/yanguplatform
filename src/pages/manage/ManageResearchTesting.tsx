import { FlaskConical, Activity, FileText } from "lucide-react";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { useManageResearch, type ResearchOverview } from "@/hooks/manage/useManageResearch";

const eventColumns: AdminColumn<ResearchOverview["recent_events"][number]>[] = [
  { key: "event_type", header: "Event", render: (r) => <span className="text-xs font-mono text-foreground">{r.event_type}</span> },
  { key: "publish_id", header: "Publish", render: (r) => <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px] block">{r.publish_id.slice(0, 8)}…</span> },
  { key: "visitor_id", header: "Visitor", render: (r) => <span className="text-xs text-muted-foreground">{r.visitor_id ? r.visitor_id.slice(0, 8) + "…" : "—"}</span> },
  { key: "created_at", header: "Time", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
];

const publishColumns: AdminColumn<ResearchOverview["recent_publishes"][number]>[] = [
  { key: "slug", header: "Slug", render: (r) => <span className="text-xs font-mono text-foreground">{r.slug}</span> },
  { key: "state", header: "State", render: (r) => <AdminStatusBadge status={r.state} /> },
  { key: "published_at", header: "Published", render: (r) => <span className="text-xs text-muted-foreground">{r.published_at ? new Date(r.published_at).toLocaleDateString() : "—"}</span> },
  { key: "created_at", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
];

export default function ManageResearchTesting() {
  const { data, isLoading, error } = useManageResearch();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <FlaskConical className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Research & Testing</h1>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Builder activity, publish health & platform telemetry</p>
        </div>
      </div>

      {error && (
        <AdminGlassCard className="p-6 border-red-500/30">
          <p className="text-sm text-red-400">Failed to load: {(error as Error).message}</p>
        </AdminGlassCard>
      )}

      {isLoading && (
        <AdminGlassCard className="p-8 text-center">
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Loading research data…</p>
        </AdminGlassCard>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AdminGlassCard className="p-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
                <Activity className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">Recent Events</p>
                <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{data.total_builder_events}</p>
              </div>
            </AdminGlassCard>
            <AdminGlassCard className="p-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
                <FileText className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">Total Publishes</p>
                <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{data.total_publishes}</p>
              </div>
            </AdminGlassCard>
            <AdminGlassCard className="p-4">
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">Published</p>
              <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{data.published_count}</p>
            </AdminGlassCard>
            <AdminGlassCard className="p-4">
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">Drafts</p>
              <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{data.draft_count}</p>
            </AdminGlassCard>
          </div>

          {/* Recent events table */}
          <div>
            <h2 className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Recent Builder Events</h2>
            <AdminTable columns={eventColumns} data={data.recent_events} rowKey={(r) => r.id} emptyMessage="No builder events recorded" />
          </div>

          {/* Recent publishes table */}
          <div>
            <h2 className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">Recent Publishes</h2>
            <AdminTable columns={publishColumns} data={data.recent_publishes} rowKey={(r) => r.id} emptyMessage="No publishes found" />
          </div>
        </>
      )}
    </div>
  );
}
