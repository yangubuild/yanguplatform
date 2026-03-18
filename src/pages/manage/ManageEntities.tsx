import { Search, Database, ShieldCheck, Eye, EyeOff, Tag } from "lucide-react";
import { useState } from "react";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { useManageEntities, type ManagedEntity } from "@/hooks/manage/useManageEntities";

const ENTITY_TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Business", value: "business" },
  { label: "Creator", value: "creator" },
  { label: "Community", value: "community" },
  { label: "Project", value: "project" },
  { label: "Product", value: "product" },
  { label: "Service", value: "service" },
  { label: "Organization", value: "organization" },
];

const columns: AdminColumn<ManagedEntity>[] = [
  {
    key: "title",
    header: "Title",
    render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{r.title}</span>
        {r.short_description && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{r.short_description}</span>
        )}
      </div>
    ),
  },
  {
    key: "entity_type",
    header: "Type",
    render: (r) => (
      <div className="flex flex-col gap-0.5">
        <AdminStatusBadge status={r.entity_type} />
        {r.entity_subtype !== "general" && (
          <span className="text-[10px] text-muted-foreground capitalize">{r.entity_subtype.replace(/_/g, " ")}</span>
        )}
      </div>
    ),
  },
  {
    key: "primary_category",
    header: "Category",
    render: (r) => (
      <span className="text-xs text-muted-foreground capitalize">{r.primary_category || r.industry || "—"}</span>
    ),
  },
  {
    key: "visibility_tier",
    header: "Visibility",
    render: (r) => <AdminStatusBadge status={r.visibility_tier} />,
  },
  {
    key: "is_published",
    header: "Published",
    render: (r) => (
      <span className="flex items-center gap-1">
        {r.is_published ? (
          <Eye className="h-3.5 w-3.5 text-[hsl(var(--admin-accent))]" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs">{r.is_published ? "Yes" : "No"}</span>
      </span>
    ),
  },
  {
    key: "is_verified",
    header: "Verified",
    render: (r) =>
      r.is_verified ? (
        <ShieldCheck className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: "is_searchable",
    header: "Searchable",
    render: (r) => (
      <AdminStatusBadge status={r.is_searchable ? "active" : "inactive"} />
    ),
  },
  {
    key: "tags",
    header: "Tags",
    render: (r) =>
      r.tags && r.tags.length > 0 ? (
        <div className="flex gap-1 flex-wrap max-w-[120px]">
          {r.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
          {r.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{r.tags.length - 3}</span>}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: "domain_host",
    header: "Domain",
    render: (r) => (
      <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px] block">
        {r.domain_host ? `${r.domain_host}/${r.slug || ""}` : r.slug || "—"}
      </span>
    ),
  },
];

export default function ManageEntities() {
  const [typeFilter, setTypeFilter] = useState("");
  const [searchableOnly, setSearchableOnly] = useState(false);
  const { data, isLoading, error } = useManageEntities(
    typeFilter || undefined,
    searchableOnly
  );

  const totalCount = data?.[0]?.total_count ?? data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <Database className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Searchable Entities</h1>
          <p className="text-sm text-muted-foreground">Canonical entity index for platform search & explore</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminGlassCard>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Entities</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
        </AdminGlassCard>
        <AdminGlassCard>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Published</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">
            {data?.filter((e) => e.is_published).length ?? 0}
          </p>
        </AdminGlassCard>
        <AdminGlassCard>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Searchable</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">
            {data?.filter((e) => e.is_searchable).length ?? 0}
          </p>
        </AdminGlassCard>
        <AdminGlassCard>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Verified</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">
            {data?.filter((e) => e.is_verified).length ?? 0}
          </p>
        </AdminGlassCard>
      </div>

      {/* Filters */}
      <AdminToolbar
        left={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                {ENTITY_TYPE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={searchableOnly}
                onChange={(e) => setSearchableOnly(e.target.checked)}
                className="rounded"
              />
              Searchable only
            </label>
          </div>
        }
      />

      {/* Table */}
      <AdminGlassCard>
        <AdminTable
          columns={columns}
          data={data ?? []}
          loading={isLoading}
          rowKey={(r) => r.id}
          emptyMessage={error ? `Error: ${error.message}` : "No entities found"}
        />
      </AdminGlassCard>
    </div>
  );
}
