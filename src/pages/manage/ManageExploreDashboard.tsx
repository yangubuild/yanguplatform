import { useState, useCallback } from "react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Users, Layers, BarChart3, ArrowUp, ArrowDown, Save } from "lucide-react";
import {
  useExploreSurfaces,
  useExploreUsersStats,
  useExploreSurfacesStats,
  useSaveManualOrder,
  type ExploreSurfaceEntry,
} from "@/hooks/manage/useManageExploreDashboard";

// ── Fill source color mapping ──
const FILL_SOURCE_COLORS: Record<string, string> = {
  ad: "bg-[hsl(0,72%,51%)] text-foreground",
  premium_subscriber: "bg-[hsl(24,95%,53%)] text-foreground",
  mid_subscriber: "bg-[hsl(38,92%,55%)] text-foreground",
  subscribed: "bg-[hsl(160,84%,45%)] text-foreground",
  engagement: "bg-[hsl(210,80%,55%)] text-foreground",
  user_published: "bg-muted text-muted-foreground",
  seeded: "bg-[hsl(270,60%,55%)] text-foreground",
  placeholder: "bg-muted/50 text-muted-foreground",
};

// ── Stat Card ──
function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Users }) {
  return (
    <div className="rounded-lg border border-border p-4 flex items-center gap-4">
      <div className="p-2 rounded-md bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Explore Surface Table ──
function ExploreSurfacesTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { data: surfaces = [], isLoading } = useExploreSurfaces();
  const saveOrder = useSaveManualOrder();
  const [localOrder, setLocalOrder] = useState<ExploreSurfaceEntry[] | null>(null);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  const displayData = localOrder ?? surfaces;

  const filtered = displayData.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner_email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(surfaces.map((s) => s.category).filter(Boolean))] as string[];

  const moveItem = useCallback(
    (index: number, direction: "up" | "down") => {
      const data = [...(localOrder ?? surfaces)];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= data.length) return;
      [data[index], data[targetIndex]] = [data[targetIndex], data[index]];
      setLocalOrder(data);
      setHasOrderChanges(true);
    },
    [localOrder, surfaces],
  );

  const handleSaveOrder = () => {
    if (!localOrder) return;
    const orderings = localOrder.map((s, i) => ({ entity_id: s.id, position: i }));
    saveOrder.mutate(orderings, {
      onSuccess: () => {
        setHasOrderChanges(false);
        setLocalOrder(null);
      },
    });
  };

  const columns: AdminColumn<ExploreSurfaceEntry>[] = [
    {
      key: "drag",
      header: "",
      className: "w-8",
      render: (r) => {
        const idx = displayData.findIndex((s) => s.id === r.id);
        return (
          <div className="flex flex-col gap-0.5">
            <button onClick={() => moveItem(idx, "up")} className="p-0.5 hover:bg-muted rounded">
              <ArrowUp className="h-3 w-3 text-muted-foreground" />
            </button>
            <button onClick={() => moveItem(idx, "down")} className="p-0.5 hover:bg-muted rounded">
              <ArrowDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        );
      },
    },
    { key: "title", header: "Surface", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: "entity_type", header: "Type", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.entity_type}</span> },
    { key: "category", header: "Category", render: (r) => <span className="text-xs text-muted-foreground">{r.category ?? "—"}</span> },
    {
      key: "fill_source",
      header: "Source",
      render: (r) => (
        <Badge className={`text-[10px] ${FILL_SOURCE_COLORS[r.fill_source] ?? "bg-muted text-muted-foreground"}`}>
          {r.fill_source.replace(/_/g, " ")}
        </Badge>
      ),
    },
    { key: "visibility_tier", header: "Tier", render: (r) => <AdminStatusBadge status={r.visibility_tier} /> },
    {
      key: "is_verified",
      header: "Verified",
      render: (r) => r.is_verified ? <span className="text-[hsl(160,84%,45%)] text-xs">✓</span> : <span className="text-muted-foreground text-xs">—</span>,
    },
    { key: "trust_score", header: "Trust", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.trust_score}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search explore surfaces…"
          showFilter
        />
        {hasOrderChanges && (
          <Button size="sm" onClick={handleSaveOrder} disabled={saveOrder.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Order
          </Button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
          onClick={() => setCategoryFilter(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        rowKey={(r) => r.id}
        emptyMessage="No surfaces feeding Explore"
      />

      {/* Source legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(FILL_SOURCE_COLORS).map(([key, cls]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${cls.split(" ")[0]}`} />
            <span className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Dashboard Tab ──
function UsersTab() {
  const { data: stats, isLoading } = useExploreUsersStats();

  if (isLoading) return <div className="space-y-4"><div className="h-20 rounded-lg bg-muted animate-pulse" /><div className="h-20 rounded-lg bg-muted animate-pulse" /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Users" value={stats?.total_users ?? 0} icon={Users} />
      <StatCard label="Published Users" value={stats?.published_users ?? 0} icon={Users} />
      <StatCard label="Active Publishers" value={stats?.active_publishers ?? 0} icon={Users} />
    </div>
  );
}

// ── All Surfaces Tab ──
function AllSurfacesTab() {
  const { data: stats, isLoading } = useExploreSurfacesStats();

  if (isLoading) return <div className="space-y-4"><div className="h-20 rounded-lg bg-muted animate-pulse" /><div className="h-20 rounded-lg bg-muted animate-pulse" /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Surfaces" value={stats?.total_surfaces ?? 0} icon={Layers} />
      <StatCard label="Published" value={stats?.published_surfaces ?? 0} icon={Layers} />
      <StatCard label="Unpublished" value={stats?.unpublished_surfaces ?? 0} icon={Layers} />
    </div>
  );
}

// ── Main Page ──
export default function ManageExploreDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Explore Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and control what surfaces appear in Explore. Manual ordering overrides ranking when set.
        </p>
      </div>

      <Tabs defaultValue="surfaces" className="w-full">
        <TabsList>
          <TabsTrigger value="surfaces" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Explore Surfaces
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="all-surfaces" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            All Surfaces
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surfaces" className="mt-4">
          <ExploreSurfacesTab />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="all-surfaces" className="mt-4">
          <AllSurfacesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
