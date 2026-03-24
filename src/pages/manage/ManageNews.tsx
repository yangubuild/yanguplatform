import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminToolbar } from "@/components/manage/AdminToolbar";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { useManageNews, type NewsArticle } from "@/hooks/manage/useManageNews";
import { useDeletePost } from "@/hooks/manage/useManageNewsActions";
import { Button } from "@/components/ui/button";

export default function ManageNews() {
  const [search, setSearch] = useState("");
  const { data: articles = [], isLoading } = useManageNews();
  const deleteMut = useDeletePost();

  const columns: AdminColumn<NewsArticle>[] = [
    {
      key: "content",
      header: "Content",
      render: (r) => (
        <span className="font-medium text-foreground max-w-[300px] truncate block">
          {r.content?.slice(0, 80) ?? "—"}{(r.content?.length ?? 0) > 80 ? "…" : ""}
        </span>
      ),
    },
    {
      key: "author_name",
      header: "Author",
      render: (r) => (
        <span className="text-muted-foreground text-sm">
          {r.author_name ?? r.author_username ?? "—"}
        </span>
      ),
    },
    {
      key: "media_type",
      header: "Media",
      render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.media_type ?? "none"}</span>,
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Delete this post?")) deleteMut.mutate(r.id);
          }}
          disabled={deleteMut.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      ),
    },
  ];

  const filtered = articles.filter(
    (a) =>
      (a.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.author_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.author_username ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search articles…" showFilter />
      <AdminTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No articles/posts found" />
    </div>
  );
}
