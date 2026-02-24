import { useState } from "react";
import { Download, Trash2, HardDrive, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { toast } from "@/hooks/use-toast";
import { isConnected, uploadFile } from "@/lib/integrations/googleDrive";
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
import { SaveToStudioButton } from "@/components/studio/assets/SaveToStudioButton";

interface ImageTileActionsProps {
  imageId: string;
  signedUrl?: string;
  storagePath: string;
  provider: string;
  onDeleted: () => void;
  /** If true, show drive connect modal instead of uploading */
  onDriveConnect?: () => void;
}

export function ImageTileActions({
  imageId,
  signedUrl,
  storagePath,
  provider,
  onDeleted,
  onDriveConnect,
}: ImageTileActionsProps) {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);

  const shortId = imageId.slice(0, 8);
  const ext = storagePath.split(".").pop() || "png";
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filename = `ada_${dateStr}_${shortId}.${ext}`;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!signedUrl) {
      toast({ title: "No file URL available", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const bucket = provider === "upload" ? "ada-uploads" : "ai-generated";

      // Delete storage object
      const { error: storageErr } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);
      if (storageErr) {
        console.error("[ImageDelete] Storage error:", storageErr);
        // Continue to delete DB row even if storage fails
      }

      // Delete ada_media row
      const { error: dbErr } = await supabase
        .from("ada_media")
        .delete()
        .eq("id", imageId);
      if (dbErr) {
        toast({ title: "Failed to delete image record", variant: "destructive" });
        setIsDeleting(false);
        return;
      }

      onDeleted();
      toast({ title: "Image deleted" });
    } catch (err) {
      console.error("[ImageDelete] Error:", err);
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveToDrive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const connected = await isConnected();
    if (!connected) {
      onDriveConnect?.();
      return;
    }
    if (!signedUrl) {
      toast({ title: "No file URL available", variant: "destructive" });
      return;
    }
    setIsSavingDrive(true);
    try {
      const result = await uploadFile({
        fileUrl: signedUrl,
        filename,
        mimeType: `image/${ext}`,
        folder: "Images",
      });
      if (result.ok) {
        toast({ title: `Saved to Google Drive` });
      } else {
        toast({ title: result.error || "Failed to save to Drive", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save to Drive", variant: "destructive" });
    } finally {
      setIsSavingDrive(false);
    }
  };

  return (
    <>
      <div
        className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
          title="Download"
        >
          <Download className="w-3 h-3" />
        </button>

        {/* Save to Studio */}
        {signedUrl && (
          <SaveToStudioButton
            fileUrl={signedUrl}
            storagePath={storagePath}
            provider={provider}
          />
        )}

        {/* Save to Google Drive */}
        <button
          onClick={handleSaveToDrive}
          disabled={isSavingDrive}
          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors disabled:opacity-50"
          title="Save to Google Drive"
        >
          {isSavingDrive ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <HardDrive className="w-3 h-3" />
          )}
        </button>

        {/* Delete (owner or admin only) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          disabled={isDeleting}
          className="p-1.5 rounded-md bg-black/60 hover:bg-red-900/80 text-white/70 hover:text-red-300 transition-colors disabled:opacity-50"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this image?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This cannot be undone. The image will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
