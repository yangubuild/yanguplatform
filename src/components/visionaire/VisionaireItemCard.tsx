import { Bookmark, BookmarkCheck, Download, Play, Headphones, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getItemThumbnail, extractDriveFileId } from "@/lib/driveUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface VisionaireItemCardProps {
  item: any;
  isSaved: boolean;
  onOpen: () => void;
  onSave: (e: React.MouseEvent) => void;
  onUnsave: (e: React.MouseEvent) => void;
  eagerLoad?: boolean;
}

async function handleDriveDownload(downloadUrl: string) {
  const fileId = extractDriveFileId(downloadUrl);
  if (!fileId) {
    window.open(downloadUrl, "_blank");
    return;
  }
  toast.info("Starting download…");
  try {
    const { data, error } = await supabase.functions.invoke("drive-download-proxy", {
      body: { file_id: fileId },
    });
    if (error) throw error;
    // data is a Blob when responseType isn't json
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Download complete!");
  } catch (err) {
    console.error("Download error:", err);
    // Fallback: open Google Drive link directly
    window.open(downloadUrl, "_blank");
  }
}

export function VisionaireItemCard({ item, isSaved, onOpen, onSave, onUnsave, eagerLoad = false }: VisionaireItemCardProps) {
  const thumbnail = getItemThumbnail(item);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={onOpen}>
      {thumbnail && !imgError ? (
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading={eagerLoad ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
          {item.type === "video" ? (
            <Play className="h-10 w-10 text-muted-foreground/40" />
          ) : item.type === "audio" || item.type === "podcast" ? (
            <Headphones className="h-10 w-10 text-muted-foreground/40" />
          ) : (
            <FileText className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>
      )}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {item.type}
          </Badge>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-1.5 pt-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            Open
          </Button>
          {item.download_url ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleDriveDownload(item.download_url);
              }}
              title="Download">
              <Download className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isSaved ? onUnsave : onSave}
            title={isSaved ? "Unsave" : "Save"}>
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-accent" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
