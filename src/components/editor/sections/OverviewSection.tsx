import { useState } from "react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Globe, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useSurfaceActions } from "@/hooks/useSurfaceActions";

interface ActivePublish {
  id: string;
  domain_id: string;
  domain_host: string;
  published_at: string | null;
}

interface SurfaceData {
  id: string;
  title: string | null;
  surface_type: string;
  status: string;
  org_id: string;
  archived_at: string | null;
  draft_slug: string | null;
  draft_domain_id: string | null;
  activePublishes: ActivePublish[];
}

interface OverviewSectionProps {
  surface: SurfaceData;
  userId: string;
  onSurfaceUpdate: (updates: Partial<SurfaceData>) => void;
}

export function OverviewSection({ surface, userId, onSurfaceUpdate }: OverviewSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(surface.title || "");
  const { renameSurface } = useSurfaceActions();

  const isPublished = surface.activePublishes.length> 0;
  const isArchived = !!surface.archived_at;

  const handleSave = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    renameSurface.mutate(
      { surfaceId: surface.id, newTitle: newTitle.trim() },
      {
        onSuccess: (data) => {
          onSurfaceUpdate({ title: newTitle.trim() });
          setIsEditing(false);
          if (data?.slug_available === false) {
            // Warning toast already shown by useSurfaceActions
          } else {
            toast.success("Surface renamed successfully!");
          }
        },
        onError: () => {
          toast.error("Failed to rename surface");
        },
      }
    );
  };

  const handleCancel = () => {
    setNewTitle(surface.title || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">Manage your surface's basic information</p>
      </div>

      {/* Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">
              {isArchived ? "Archived" : isPublished ? "Live" : "Draft"}
            </p>
          </div>
          <Badge 
            variant={isPublished ? "default" : "secondary"}
            className={isPublished ? "bg-success text-success-foreground" : ""}>
            {isArchived ? "Archived" : isPublished ? "Live" : "Draft"}
          </Badge>
        </div>
      </Card>

      {/* Title Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Title</Label>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isArchived}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Surface title"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!newTitle.trim() || renameSurface.isPending}>
                  {renameSurface.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-lg">{surface.title || "Untitled Surface"}</p>
          )}
        </div>
      </Card>

      {/* Type Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-accent/10">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Surface Type</h3>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {surface.surface_type}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Surface type cannot be changed after creation.
            </p>
          </div>
        </div>
      </Card>

      {/* Active Publishes */}
      {isPublished && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Published Locations</h3>
          <div className="flex flex-wrap gap-2">
            {surface.activePublishes.map((pub) => (
              <Badge key={pub.id} variant="outline" className="text-sm">
                {pub.domain_host}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
