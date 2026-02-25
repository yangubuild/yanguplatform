import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EditorPage } from "@/hooks/useBuilderEditor";

interface Props {
  pages: EditorPage[];
  activePageId: string | null;
  surfaceId: string;
  onSwitch: (pageId: string) => void;
  onRefresh: () => void;
}

type ModalMode = null | "create" | "rename" | "delete";

export function BuilderPagesDropdown({ pages, activePageId, surfaceId, onSwitch, onRefresh }: Props) {
  const [mode, setMode] = useState<ModalMode>(null);
  const [targetPage, setTargetPage] = useState<EditorPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId);

  const openCreate = () => { setTitle(""); setSlug(""); setMode("create"); };
  const openRename = (page: EditorPage) => { setTargetPage(page); setTitle(page.title); setSlug(page.slug); setMode("rename"); };
  const openDelete = (page: EditorPage) => { setTargetPage(page); setMode("delete"); };
  const close = () => { setMode(null); setTargetPage(null); };

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("builder_create_page", {
        p_surface_id: surfaceId,
        p_slug: slug.trim(),
        p_title: title.trim(),
      });
      if (error) throw new Error(error.message);
      const result = data as unknown as { ok: boolean; error?: string; page?: { id: string } };
      if (!result.ok) throw new Error(result.error || "Failed");
      toast.success("Page created");
      onRefresh();
      if (result.page?.id) onSwitch(result.page.id);
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!targetPage || !title.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("builder_rename_page", {
        p_page_id: targetPage.id,
        p_title: title.trim(),
        p_slug: slug.trim() || targetPage.slug,
      });
      if (error) throw new Error(error.message);
      const result = data as unknown as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error || "Failed");
      toast.success("Page renamed");
      onRefresh();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename page");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!targetPage) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("builder_delete_page", {
        p_page_id: targetPage.id,
      });
      if (error) throw new Error(error.message);
      const result = data as unknown as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error || "Failed");
      toast.success("Page deleted");
      // Switch to first remaining page
      const remaining = pages.filter((p) => p.id !== targetPage.id);
      if (remaining.length > 0) onSwitch(remaining[0].id);
      onRefresh();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            {activePage?.title || "Page"}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {pages.map((page) => (
            <DropdownMenuItem
              key={page.id}
              className="flex items-center justify-between group"
              onClick={() => onSwitch(page.id)}
            >
              <span className={page.id === activePageId ? "font-semibold" : ""}>
                {page.title}
                <span className="ml-1.5 text-muted-foreground text-[10px]">/{page.slug}</span>
              </span>
              <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); openRename(page); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                {pages.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); openDelete(page); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            Add page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create / Rename dialog */}
      <Dialog open={mode === "create" || mode === "rename"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Page" : "Rename Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (mode === "create") setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="About Us" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" disabled={busy || !title.trim()} onClick={mode === "create" ? handleCreate : handleRename}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={mode === "delete"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete "{targetPage?.title}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">All sections on this page will be removed. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={handleDelete}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
