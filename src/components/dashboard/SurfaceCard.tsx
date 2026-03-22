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
  Loader2,
  CloudOff,
  Rocket,
  Users,
  UserMinus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SurfaceWithPublishes } from "@/hooks/useSurfaces";
import { useSurfaceActions } from "@/hooks/useSurfaceActions";
import { useCommunityListing } from "@/hooks/useCommunityListing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [republishDialogOpen, setRepublishDialogOpen] = useState(false);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [newTitle, setNewTitle] = useState(surface.title || "");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");

  const {
    renameSurface,
    unpublishSurface,
    archiveSurface,
    unarchiveSurface,
    deleteSurface,
    republishSurface,
  } = useSurfaceActions();

  const { isListed, status: communityStatus, listOnCommunity, unlistFromCommunity, invalidate: invalidateCommunity } = useCommunityListing(surface.id);

  const isArchived = !!surface.archived_at;
  const hasActivePublish = surface.activePublishes.length> 0;
  const isPublished = hasActivePublish;

  const lastPublish = surface.activePublishes[0] || null;
  const canRepublish = !isPublished && !isArchived && !!surface.draft_domain_id && !!surface.draft_slug;

  const handleRename = () => {
    if (newTitle.trim()) {
      renameSurface.mutate(
        { surfaceId: surface.id, newTitle: newTitle.trim() },
        {
          onSuccess: (data) => {
            setRenameDialogOpen(false);
          },
        }
      );
    }
  };

  const handleUnpublish = () => {
    if (surface.activePublishes.length === 1) {
      unpublishSurface.mutate({
        surfaceId: surface.id,
        domainId: surface.activePublishes[0].domain_id,
      });
      setUnpublishDialogOpen(false);
    } else if (selectedDomainId) {
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
    if (surface.activePublishes.length> 1) {
      setSelectedDomainId(surface.activePublishes[0].domain_id);
    }
    setUnpublishDialogOpen(true);
  };

  const handleRepublish = () => {
    if (lastPublish) {
      republishSurface.mutate({
        surfaceId: surface.id,
        domainId: lastPublish.domain_id,
        slug: lastPublish.slug || surface.draft_slug || "",
      });
    } else if (surface.draft_domain_id && surface.draft_slug) {
      republishSurface.mutate({
        surfaceId: surface.id,
        domainId: surface.draft_domain_id,
        slug: surface.draft_slug,
      });
    }
    setRepublishDialogOpen(false);
  };

  // Community listing flow
  const handleListOnCommunity = async () => {
    console.log("[Community] === START List on Community ===", { surfaceId: surface.id, archived_at: surface.archived_at });
    setCommunityLoading(true);
    try {
      if (isArchived) {
        console.log("[Community] Surface is archived, showing unarchive modal");
        setUnarchiveModalOpen(true);
        setCommunityLoading(false);
        return;
      }
      await attemptListOnCommunity();
    } finally {
      setCommunityLoading(false);
    }
  };

  const attemptListOnCommunity = async () => {
    // Call list_on_community directly — it enforces all eligibility rules server-side
    console.log("[Community] Step: list_on_community →", { p_surface_id: surface.id });
    const { data: listResult, error: listError } = await (supabase.rpc as any)("list_on_community", {
      p_surface_id: surface.id,
    });
    console.log("[Community] list_on_community result:", { data: listResult, error: listError });

    if (listError) {
      console.error("[Community] FAIL list_on_community:", listError);
      // Map known RPC error codes to user-friendly messages
      const msg = listError.message || "";
      if (msg.includes("surface_archived")) {
        toast.error("Surface is archived — unarchive it first.");
      } else if (msg.includes("not_eligible")) {
        toast.error("Must be published on yangu.community first.");
      } else if (msg.includes("permission") || msg.includes("denied")) {
        toast.error("You don't have permission to list this surface.");
      } else {
        toast.error(msg || "Failed to list on Community");
      }
      return;
    }

    // Handle structured { success, error } response
    if (listResult && typeof listResult === "object" && "success" in listResult && !listResult.success) {
      console.error("[Community] list_on_community returned failure:", listResult);
      const errMsg = (listResult as any).error || "";
      if (errMsg.includes("surface_archived")) {
        toast.error("Surface is archived — unarchive it first.");
      } else if (errMsg.includes("not_eligible")) {
        toast.error("Must be published on yangu.community first.");
      } else if (errMsg.includes("permission") || errMsg.includes("denied")) {
        toast.error("You don't have permission to list this surface.");
      } else {
        toast.error(errMsg || "Failed to list on Community");
      }
      return;
    }

    toast.success("Listed on Community");

    // Refetch listing row for verification
    console.log("[Community] Refetching community_listings for surface", surface.id);
    const { data: listingRow, error: fetchErr } = await (supabase as any)
      .from("community_listings")
      .select("*")
      .eq("surface_id", surface.id)
      .maybeSingle();
    console.log("[Community] community_listings row:", listingRow, "error:", fetchErr);

    // Invalidate queries to update UI (badge + menu toggle)
    invalidateCommunity();
    console.log("[Community] === DONE ===");
  };

  const handleUnarchiveAndList = async () => {
    setUnarchiveModalOpen(false);
    setCommunityLoading(true);
    try {
      // Step: Unarchive
      console.log("[Community] Step: unarchive_surface →", { p_surface_id: surface.id, current_archived_at: surface.archived_at });
      const { data, error } = await supabase.rpc("unarchive_surface", {
        p_surface_id: surface.id,
      });
      console.log("[Community] unarchive_surface result:", { data, error });
      if (error) {
        console.error("[Community] FAIL unarchive_surface:", error);
        toast.error(error.message);
        return;
      }
      const result = data as unknown as { success: boolean; error?: string };
      if (!result?.success) {
        console.error("[Community] unarchive_surface returned failure:", result);
        toast.error(result?.error || "Failed to unarchive surface");
        return;
      }
      toast.success("Surface restored");

      // Verify unarchive by refetching
      console.log("[Community] Verifying unarchive — refetching surface row");
      const { data: freshSurface, error: refetchErr } = await (supabase as any)
        .from("surfaces")
        .select("id, archived_at")
        .eq("id", surface.id)
        .maybeSingle();
      console.log("[Community] Surface after unarchive:", freshSurface, "error:", refetchErr);
      if (freshSurface?.archived_at) {
        console.error("[Community] Surface still archived after unarchive RPC!");
        toast.error("Surface is still archived — cannot list on Community");
        return;
      }

      // Now attempt listing
      await attemptListOnCommunity();
    } finally {
      setCommunityLoading(false);
    }
  };

  const handleUnlistFromCommunity = () => {
    unlistFromCommunity.mutate();
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
              {isListed && (
                <Badge variant="outline" className="text-xs border-success text-success">
                  Community
                </Badge>
              )}
              <Badge
                variant={isPublished ? "default" : "secondary"}
                className={`flex-shrink-0 ${isPublished ? "bg-success text-success-foreground" : ""}`}>
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
                        }}>
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

                      {/* Community listing actions in dropdown */}
                      {isListed ? (
                        <DropdownMenuItem onClick={handleUnlistFromCommunity}>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unlist from Community
                        </DropdownMenuItem>
                      ) : isPublished ? (
                        <DropdownMenuItem onClick={handleListOnCommunity}>
                          <Users className="h-4 w-4 mr-2" />
                          List on Community
                        </DropdownMenuItem>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <DropdownMenuItem disabled>
                                <Users className="h-4 w-4 mr-2" />
                                List on Community
                              </DropdownMenuItem>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Publish this surface to list it on Community.
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => setArchiveDialogOpen(true)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}

                  {isArchived && (
                    <>
                      <DropdownMenuItem onClick={handleRestore}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Unarchive
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive">
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
            {isArchived ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Archive className="h-4 w-4 mr-2" />
                      Archived
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Unarchive this surface to manage publishing</TooltipContent>
              </Tooltip>
            ) : isPublished ? (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={openUnpublishDialog}
                disabled={unpublishSurface.isPending}>
                {unpublishSurface.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudOff className="h-4 w-4 mr-2" />
                )}
                {unpublishSurface.isPending ? "Unpublishing..." : "Unpublish"}
              </Button>
            ) : canRepublish ? (
              <Button
                variant="accent"
                size="sm"
                className="flex-1"
                onClick={() => setRepublishDialogOpen(true)}
                disabled={republishSurface.isPending}>
                {republishSurface.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                {republishSurface.isPending ? "Publishing..." : "Republish"}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit?.(surface)}
              disabled={isArchived}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </Card>

      {/* Unarchive & List Modal */}
      <AlertDialog open={unarchiveModalOpen} onOpenChange={setUnarchiveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Surface is Archived</AlertDialogTitle>
            <AlertDialogDescription>
              This surface is archived. Unarchive it to list on Community.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnarchiveAndList}
              disabled={communityLoading}>
              {communityLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Unarchive & Continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              disabled={!newTitle.trim() || renameSurface.isPending}>
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
              This will remove the surface from the live site. You can publish it again anytime.
            </DialogDescription>
          </DialogHeader>
          {surface.activePublishes.length> 1 && (
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
              disabled={unpublishSurface.isPending}>
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
              Archived surfaces are hidden and can't be published until unarchived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiveSurface.isPending}>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteSurface.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Republish Dialog */}
      <AlertDialog open={republishDialogOpen} onOpenChange={setRepublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Republish Surface</AlertDialogTitle>
            <AlertDialogDescription>
              Republish this page and make it live again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRepublish}
              disabled={republishSurface.isPending}>
              {republishSurface.isPending ? "Publishing..." : "Republish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
