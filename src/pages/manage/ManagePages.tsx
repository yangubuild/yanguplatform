import { useState } from "react";
import { FileStack, Trash2 } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { useManagePages, type ManagedPage } from "@/hooks/manage/useManagePages";
import { useDeletePage } from "@/hooks/manage/useManagePageActions";
import { Button } from "@/components/ui/button";

export default function ManagePages() {
  const [search, setSearch] = useState("");
  const { data: pages = [], isLoading } = useManagePages();
  const deleteMut = useDeletePage();

  const columns: AdminColumn<ManagedPage>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: "slug", header: "Slug", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.slug}</span> },
    { key: "surface_title", header: "Surface", render: (r) => <span className="text-sm text-muted-foreground">{r.surface_title ?? "—"}</span> },
    { key: "section_count", header: "Sections", render: (r) => <span className="text-sm text-muted-foreground">{r.section_count}</span> },
    { key: "updated_at", header: "Last Updated", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm(`Delete page "${r.title}" and its ${r.section_count} sections?`)) {
              deleteMut.mutate(r.id);
            }
          }}
          disabled={deleteMut.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      ),
    },
  ];

  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.surface_title ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
          <FileStack className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Pages</h1>
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Builder pages and section inventory</p>
        </div>
      </div>
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search pages…" showFilter />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No builder pages created yet" />
    </div>
  );
}
