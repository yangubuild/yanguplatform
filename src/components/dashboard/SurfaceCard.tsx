import { useState } from "react";
import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Pencil,
  Globe,
  Archive,
  Trash2,
  RotateCcw,
  GlobeIcon,
} from "lucide-react";
import type { SurfaceWithPublishes } from "@/hooks/useSurfaces";
import { useSurfaceActions } from "@/hooks/useSurfaceActions";

interface SurfaceCardProps {
  surface: SurfaceWithPublishes;
  onEdit?: (surface: SurfaceWithPublishes) => void;
  onPreview?: (surface: SurfaceWithPublishes) => void;
}

export function SurfaceCard({ surface, onEdit, onPreview }: SurfaceCardProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(surface.title || "");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");

  const {
    renameSurface,
    unpublishSurface,
    archiveSurface,
    unarchiveSurface,
    deleteSurface,
  } = useSurfaceActions();

  const isArchived = !!surface.archived_at;
  const hasActivePublish = surface.activePublishes.length > 0;
  const isPublished = hasActivePublish;

  const handleRename = () => {
    if (newTitle.trim()) {
      renameSurface.mutate({ surfaceId: surface.id, newTitle: newTitle.trim() });
      setRenameDialogOpen(false);
    }
  };

  const handleUnpublish = () => {
    if (surface.activePublishes.length === 1) {
      // Single publish - unpublish directly
      unpublishSurface.mutate({
        surfaceId: surface.id,
        domainId: surface.activePublishes[0].domain_id,
      });
      setUnpublishDialogOpen(false);
    } else if (selectedDomainId) {
      // Multiple publishes - use selected domain
      unpublishSurface.mutate({
        surfaceId: surface.id,
        domainId: selectedDomainId,
      });
      setUnpublishDialogOpen(false);
      setSelectedDomainId("");
    }
  };

  const handleArchive = () => {
    archiveSurface.mutate(surface.id);
    setArchiveDialogOpen(false);
  };

  const handleRestore = () => {
    unarchiveSurface.mutate(surface.id);
  };

  const handleDelete = () => {
    deleteSurface.mutate(surface.id);
    setDeleteDialogOpen(false);
  };

  const openUnpublishDialog = () => {
    if (surface.activePublishes.length > 1) {
      setSelectedDomainId(surface.activePublishes[0].domain_id);
    }
    setUnpublishDialogOpen(true);
  };

  return (
    <>
      <Card className={`p-5 ${isArchived ? "opacity-60" : ""}`}>
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {surface.title || "Untitled Surface"}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate capitalize">{surface.surface_type}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isPublished ? "default" : "secondary"}
                className={`flex-shrink-0 ${isPublished ? "bg-success text-success-foreground" : ""}`}
              >
                {isArchived ? "Archived" : isPublished ? "Live" : "Draft"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isArchived && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setNewTitle(surface.title || "");
                          setRenameDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>

                      {hasActivePublish && (
                        <DropdownMenuItem onClick={openUnpublishDialog}>
                          <GlobeIcon className="h-4 w-4 mr-2" />
                          Unpublish
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => setArchiveDialogOpen(true)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}

                  {isArchived && (
                    <DropdownMenuItem onClick={handleRestore}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Unarchive
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Publishes */}
          {hasActivePublish && (
            <div className="flex flex-wrap gap-2">
              {surface.activePublishes.map((pub) => (
                <Badge key={pub.id} variant="outline" className="text-xs">
                  {pub.domain_host}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit?.(surface)}
              disabled={isArchived}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onPreview?.(surface)}
              disabled={isArchived}
            >
              <Globe className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Surface</DialogTitle>
            <DialogDescription>
              Enter a new name for this surface.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Surface title"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newTitle.trim() || renameSurface.isPending}
            >
              {renameSurface.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Dialog */}
      <Dialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Surface</DialogTitle>
            <DialogDescription>
              This removes the surface from the live domain but keeps it saved.
            </DialogDescription>
          </DialogHeader>
          {surface.activePublishes.length > 1 && (
            <div className="py-4">
              <Label>Select domain to unpublish from</Label>
              <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {surface.activePublishes.map((pub) => (
                    <SelectItem key={pub.domain_id} value={pub.domain_id}>
                      {pub.domain_host}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnpublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={unpublishSurface.isPending}
            >
              {unpublishSurface.isPending ? "Unpublishing..." : "Unpublish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Surface</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the surface from your dashboard. You can restore it
              later from the archived surfaces view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiveSurface.isPending}
            >
              {archiveSurface.isPending ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Surface</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. The surface and all
              its content will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSurface.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSurface.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
