import { Bookmark, BookmarkCheck, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisionaireItemCardProps {
  item: any;
  isSaved: boolean;
  onOpen: () => void;
  onSave: (e: React.MouseEvent) => void;
  onUnsave: (e: React.MouseEvent) => void;
}

export function VisionaireItemCard({ item, isSaved, onOpen, onSave, onUnsave }: VisionaireItemCardProps) {
  return (
    <div
      className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {item.thumbnail_url && (
        <div className="overflow-hidden bg-muted">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-auto block transition-transform group-hover:scale-105"
            loading="lazy"
          />
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
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
          >
            Open
          </Button>
          {item.download_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.download_url, "_blank");
              }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={isSaved ? onUnsave : onSave}
            title={isSaved ? "Unsave" : "Save"}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-accent" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          {item.external_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.external_url, "_blank");
              }}
              title="Open source"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
