import { useState } from "react";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers, MoreHorizontal, Eye, EyeOff, ImageOff, Star, Globe,
} from "lucide-react";
import { useManageSurfaceModeration, useSurfaceAction, type ModeratedSurface } from "@/hooks/manage/useManageSurfaceModeration";
import { toast } from "sonner";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageSurfaceModeration() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = search.length > 2 ? search : null;

  const { data: surfaces = [], isLoading } = useManageSurfaceModeration(
    filter === "all" ? null : filter,
    debouncedSearch,
  );
  const action = useSurfaceAction();

  const publishedCount = surfaces.filter((s) => s.mod_status === "published").length;
  const noCoverCount = surfaces.filter((s) => !s.has_cover_image).length;
  const unpublishedCount = surfaces.filter((s) => s.mod_status === "unpublished").length;

  const handleAction = (surface: ModeratedSurface, act: "unpublish" | "republish") => {
    action.mutate(
      { publishId: surface.id, action: act },
      {
        onSuccess: () => toast.success(`Surface ${act === "unpublish" ? "unpublished" : "republished"}`),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      },
    );
  };

  const columns: AdminColumn<ModeratedSurface>[] = [
    {
      key: "surface_title",
      header: "Surface",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{r.surface_title}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{r.surface_slug}</span>
        </div>
      ),
    },
    {
      key: "surface_type",
      header: "Type",
      render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.surface_type.replace(/_/g, " ")}</span>,
    },
    {
      key: "domain_host",
      header: "Domain",
      render: (r) => <span className="text-xs text-muted-foreground font-mono">{r.domain_host}</span>,
    },
    {
      key: "cover",
      header: "Cover",
      render: (r) =>
        r.has_cover_image ? (
          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Has Image</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
            <ImageOff className="h-3 w-3 mr-1" /> Missing
          </Badge>
        ),
    },
    {
      key: "username",
      header: "Creator",
      render: (r) => <span className="text-xs text-muted-foreground">{r.username ? `@${r.username}` : r.display_name ?? "—"}</span>,
    },
    {
      key: "mod_status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.mod_status} />,
    },
    {
      key: "published_at",
      header: "Published",
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.published_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {r.mod_status === "published" && (
              <DropdownMenuItem onClick={() => handleAction(r, "unpublish")} className="text-destructive">
                <EyeOff className="mr-2 h-3.5 w-3.5" /> Unpublish
              </DropdownMenuItem>
            )}
            {r.mod_status === "unpublished" && (
              <DropdownMenuItem onClick={() => handleAction(r, "republish")}>
                <Eye className="mr-2 h-3.5 w-3.5" /> Republish
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Surface Moderation" description="Review and moderate all published surfaces" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<Globe className="h-4 w-4" />} label="Published" value={publishedCount} />
        <AdminMetricCard icon={<ImageOff className="h-4 w-4" />} label="Missing Cover" value={noCoverCount} />
        <AdminMetricCard icon={<EyeOff className="h-4 w-4" />} label="Unpublished" value={unpublishedCount} />
        <AdminMetricCard icon={<Layers className="h-4 w-4" />} label="Total" value={surfaces.length} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="unpublished">Unpublished</SelectItem>
            <SelectItem value="no_cover">Missing Cover</SelectItem>
          </SelectContent>
        </Select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, slug, or domain…"
          className="flex-1 min-w-[200px] max-w-sm bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors"
        />
      </div>

      <AdminTable columns={columns} data={surfaces} loading={isLoading} rowKey={(r) => r.id} />
    </div>
  );
}
