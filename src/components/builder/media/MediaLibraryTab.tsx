/**
 * MediaLibraryTab — Browse, select, delete, download assets from builder_media_assets table.
 * Supports scoping by current surface/project or all user assets.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Trash2,
  Download,
  Search,
  FolderOpen,
  Film,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface LibraryAsset {
  id: string;
  name: string;
  path: string;
  publicUrl: string;
  isVideo: boolean;
  sourceType: string;
  createdAt: string;
}

interface MediaLibraryTabProps {
  onSelect: (url: string, source: "upload" | "ai") => void;
  surfaceId?: string;
}

const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

function isVideoFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTS.has(ext);
}

type ScopeFilter = "project" | "all";

export function MediaLibraryTab({ onSelect, surfaceId }: MediaLibraryTabProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [scope, setScope] = useState<ScopeFilter>("project");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from("builder_media_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (scope === "project" && surfaceId) {
        query = query.eq("surface_id", surfaceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: LibraryAsset[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.file_name,
        path: row.storage_path,
        publicUrl: row.public_url,
        isVideo: isVideoFile(row.file_name),
        sourceType: row.source_type || "upload",
        createdAt: row.created_at,
      }));

      setAssets(mapped);
    } catch (err) {
      console.error("Library load error:", err);
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [scope, surfaceId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleDelete = async (asset: LibraryAsset) => {
    setDeleting(asset.id);
    try {
      // Delete from storage
      await supabase.storage.from("builder-media").remove([asset.path]);
      // Delete from tracking table
      const { error } = await supabase
        .from("builder_media_assets")
        .delete()
        .eq("id", asset.id);
      if (error) throw error;
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      toast.success("Asset deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete asset");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (asset: LibraryAsset) => {
    const a = document.createElement("a");
    a.href = asset.publicUrl;
    a.download = asset.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = search.trim()
    ? assets.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      )
    : assets;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading library...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Scope toggle */}
      <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
        <button
          onClick={() => setScope("project")}
          className={`flex-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
            scope === "project"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          This Project
        </button>
        <button
          onClick={() => setScope("all")}
          className={`flex-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
            scope === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Assets
        </button>
      </div>

      {/* Search + Refresh */}
      {assets.length > 0 && (
        <div className="flex gap-1.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter assets..."
            className="text-sm flex-1"
          />
          <Button size="sm" variant="ghost" onClick={loadAssets} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 space-y-1.5">
          <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {assets.length === 0
              ? scope === "project"
                ? "No assets for this project yet."
                : "No assets yet. Upload or generate images to build your library."
              : "No assets match your filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              deleting={deleting}
              onSelect={onSelect}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {filtered.length} asset{filtered.length !== 1 ? "s" : ""} · {scope === "project" ? "This project" : "All projects"}
      </p>
    </div>
  );
}

/* ─── Asset Card (extracted for clarity) ─── */
function AssetCard({
  asset,
  deleting,
  onSelect,
  onDelete,
  onDownload,
}: {
  asset: LibraryAsset;
  deleting: string | null;
  onSelect: (url: string, source: "upload" | "ai") => void;
  onDelete: (a: LibraryAsset) => void;
  onDownload: (a: LibraryAsset) => void;
}) {
  const source = (asset.sourceType === "ai" ? "ai" : "upload") as "upload" | "ai";

  return (
    <div
      className="relative group rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary cursor-pointer"
      onClick={() => onSelect(asset.publicUrl, source)}
    >
      {asset.isVideo ? (
        <div className="w-full h-16 bg-muted flex items-center justify-center">
          <Film className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={asset.publicUrl}
          alt={asset.name}
          className="w-full h-16 object-cover"
          loading="lazy"
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
          title="Download"
        >
          <Download className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:text-red-400 hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
          disabled={deleting === asset.id}
          title="Delete"
        >
          {deleting === asset.id ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* File name + source badge */}
      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white truncate px-1">
        {asset.name.length > 20 ? `...${asset.name.slice(-18)}` : asset.name}
      </span>
    </div>
  );
}
