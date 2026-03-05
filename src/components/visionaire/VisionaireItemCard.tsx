import { Bookmark, BookmarkCheck, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisionaireItemCardProps {
  item: any;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}

export function VisionaireItemCard({ item, isSaved, onSave, onUnsave }: VisionaireItemCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      {item.thumbnail_url && (
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {item.type}
          </Badge>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-1.5 pt-1">
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
          {item.download_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={item.download_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
          {item.external_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
