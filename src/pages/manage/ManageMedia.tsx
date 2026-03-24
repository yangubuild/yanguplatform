import { useState } from "react";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Image, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { useManageMedia, useMediaUpdate, useMediaDelete, type MediaAsset } from "@/hooks/manage/useManageMedia";
import { toast } from "sonner";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ManageMedia() {
  const [search, setSearch] = useState("");
  const debouncedSearch = search.length > 2 ? search : null;
  const { data: assets = [], isLoading } = useManageMedia(debouncedSearch);
  const updateMut = useMediaUpdate();
  const deleteMut = useMediaDelete();

  const [editAsset, setEditAsset] = useState<MediaAsset | null>(null);
  const [newUrl, setNewUrl] = useState("");

  const handleUpdate = () => {
    if (!editAsset || !newUrl.trim()) return;
    updateMut.mutate(
      { id: editAsset.id, imageUrl: newUrl.trim() },
      {
        onSuccess: () => { toast.success("Image updated"); setEditAsset(null); setNewUrl(""); },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      },
    );
  };

  const handleDelete = (asset: MediaAsset) => {
    if (!confirm(`Delete ${asset.section_key}/${asset.slot_key}?`)) return;
    deleteMut.mutate(asset.id, {
      onSuccess: () => toast.success("Asset deleted"),
      onError: (e) => toast.error(`Failed: ${e.message}`),
    });
  };

  const columns: AdminColumn<MediaAsset>[] = [
    {
      key: "preview",
      header: "",
      render: (r) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {r.image_url ? (
            <img src={r.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    { key: "section_key", header: "Section", render: (r) => <span className="text-sm font-medium text-foreground">{r.section_key}</span> },
    { key: "slot_key", header: "Slot", render: (r) => <span className="text-xs text-muted-foreground font-mono">{r.slot_key}</span> },
    { key: "updated_at", header: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.updated_at)}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditAsset(r); setNewUrl(r.image_url); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Replace Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(r.image_url); toast.success("URL copied"); }}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(r)} className="text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Media Control" description="Manage platform images, banners, and assets — no redeploy required" />

      <div className="grid grid-cols-2 gap-3">
        <AdminMetricCard icon={<Image className="h-4 w-4" />} label="Total Assets" value={assets.length} />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by section or slot…"
        className="w-full max-w-sm bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors"
      />

      <AdminTable columns={columns} data={assets} loading={isLoading} rowKey={(r) => r.id} />

      {/* Edit Sheet */}
      <Sheet open={!!editAsset} onOpenChange={() => setEditAsset(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Replace Image</SheetTitle>
            <SheetDescription>{editAsset?.section_key} / {editAsset?.slot_key}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {editAsset?.image_url && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <img src={editAsset.image_url} alt="" className="w-full max-h-48 object-contain" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">New Image URL</label>
              <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={handleUpdate} disabled={updateMut.isPending || !newUrl.trim()} className="w-full">
              {updateMut.isPending ? "Updating…" : "Update Image"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
