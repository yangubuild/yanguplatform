/**
 * MediaLibraryTab — Browse, select, delete, download assets from builder-media bucket.
 * Shows all previously uploaded/generated assets for the current user.
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
} from "lucide-react";
import { toast } from "sonner";

interface LibraryAsset {
  name: string;
  path: string;
  publicUrl: string;
  isVideo: boolean;
  size: number;
  createdAt: string;
}

interface MediaLibraryTabProps {
  onSelect: (url: string, source: "upload" | "ai") => void;
}

const VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);

function isVideoFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return VIDEO_EXTS.has(ext);
}

export function MediaLibraryTab({ onSelect }: MediaLibraryTabProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // List all folders/files recursively under user's directory
      const allAssets: LibraryAsset[] = [];

      // List top-level folders for this user
      const { data: folders, error: foldersErr } = await supabase.storage
        .from("builder-media")
        .list(userId, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

      if (foldersErr) throw foldersErr;

      for (const item of folders || []) {
        if (item.metadata) {
          // It's a file at root level
          const path = `${userId}/${item.name}`;
          const { data: pub } = supabase.storage
            .from("builder-media")
            .getPublicUrl(path);
          allAssets.push({
            name: item.name,
            path,
            publicUrl: pub.publicUrl,
            isVideo: isVideoFile(item.name),
            size: item.metadata?.size || 0,
            createdAt: item.created_at || "",
          });
        } else {
          // It's a subfolder — list its contents
          const subPath = `${userId}/${item.name}`;
          const { data: subFiles } = await supabase.storage
            .from("builder-media")
            .list(subPath, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

          for (const sf of subFiles || []) {
            if (!sf.metadata) continue; // skip nested folders
            const filePath = `${subPath}/${sf.name}`;
            const { data: pub } = supabase.storage
              .from("builder-media")
              .getPublicUrl(filePath);
            allAssets.push({
              name: sf.name,
              path: filePath,
              publicUrl: pub.publicUrl,
              isVideo: isVideoFile(sf.name),
              size: sf.metadata?.size || 0,
              createdAt: sf.created_at || "",
            });
          }
        }
      }

      setAssets(allAssets);
    } catch (err) {
      console.error("Library load error:", err);
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleDelete = async (asset: LibraryAsset) => {
    setDeleting(asset.path);
    try {
      const { error } = await supabase.storage
        .from("builder-media")
        .remove([asset.path]);
      if (error) throw error;
      setAssets((prev) => prev.filter((a) => a.path !== asset.path));
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
      {assets.length > 0 && (
        <div className="flex gap-1.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter assets..."
            className="text-sm flex-1"
          />
          <Button size="sm" variant="ghost" onClick={loadAssets} title="Refresh">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-6 space-y-1.5">
          <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {assets.length === 0
              ? "No assets yet. Upload or generate images to build your library."
              : "No assets match your filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
          {filtered.map((asset) => (
            <div
              key={asset.path}
              className="relative group rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary cursor-pointer"
              onClick={() => {
                const source = asset.path.includes("ai-") ? "ai" : "upload";
                onSelect(asset.publicUrl, source as "upload" | "ai");
              }}
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

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(asset);
                  }}
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:text-red-400 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset);
                  }}
                  disabled={deleting === asset.path}
                  title="Delete"
                >
                  {deleting === asset.path ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* File name */}
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white truncate px-1">
                {asset.name.length > 20
                  ? `...${asset.name.slice(-18)}`
                  : asset.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {filtered.length} asset{filtered.length !== 1 ? "s" : ""} in library
      </p>
    </div>
  );
}
