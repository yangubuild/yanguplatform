import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Globe } from "lucide-react";
import type { SurfaceWithDomain } from "@/hooks/useSurfaces";

interface SurfaceCardProps {
  surface: SurfaceWithDomain;
  onEdit?: (surface: SurfaceWithDomain) => void;
  onPreview?: (surface: SurfaceWithDomain) => void;
}

export function SurfaceCard({ surface, onEdit, onPreview }: SurfaceCardProps) {
  const fullUrl = `${surface.domain.domain}/${surface.slug}`;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{surface.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{fullUrl}</span>
            </div>
          </div>
          <Badge 
            variant={surface.is_published ? "default" : "secondary"}
            className="flex-shrink-0"
          >
            {surface.is_published ? "Published" : "Draft"}
          </Badge>
        </div>

        {/* Domain Type */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {surface.domain.label}
          </Badge>
        </div>

        {/* Description */}
        {surface.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {surface.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit?.(surface)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreview?.(surface)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
    </Card>
  );
}
