/**
 * Surface Settings Dialog — Edit SEO/branding metadata per surface.
 * Used in My Business surface cards and publish flow.
 */
import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Image as ImageIcon, Crop } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageCropDialog } from "./ImageCropDialog";

export interface SurfaceMetadata {
  seo_title: string;
  seo_description: string;
  favicon_url: string;
  cover_image_url: string;
}

interface SurfaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceId: string;
  surfaceTitle: string;
  initial: Partial<SurfaceMetadata>;
  onSaved?: (meta: SurfaceMetadata) => void;
}

export function SurfaceSettingsDialog({
  open,
  onOpenChange,
  surfaceId,
  surfaceTitle,
  initial,
  onSaved,
}: SurfaceSettingsDialogProps) {
  const [seoTitle, setSeoTitle] = useState(initial.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initial.seo_description || "");
  const [faviconUrl, setFaviconUrl] = useState(initial.favicon_url || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial.cover_image_url || "");
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");

  // Reset fields when dialog re-opens with new initial values
  useEffect(() => {
    if (open) {
      setSeoTitle(initial.seo_title || "");
      setSeoDescription(initial.seo_description || "");
      setFaviconUrl(initial.favicon_url || "");
      setCoverImageUrl(initial.cover_image_url || "");
    }
  }, [open, initial.seo_title, initial.seo_description, initial.favicon_url, initial.cover_image_url]);

  const handleUpload = useCallback(
    async (file: File, type: "favicon" | "cover") => {
      const setter = type === "favicon" ? setFaviconUrl : setCoverImageUrl;
      const setUploading = type === "favicon" ? setUploadingFavicon : setUploadingCover;

      setUploading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast.error("Please sign in"); return; }

        const userId = session.user.id;
        const ext = file.name.split(".").pop() || "png";
        const path = `${userId}/${surfaceId}/${type}-${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("builder-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase.storage
          .from("builder-media")
          .getPublicUrl(path);

        setter(publicData.publicUrl);
        toast.success(`${type === "favicon" ? "Favicon" : "Cover image"} uploaded`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [surfaceId]
  );

  const triggerFileInput = (type: "favicon" | "cover") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleUpload(f, type);
    };
    input.click();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let resolvedCoverImageUrl = coverImageUrl || null;

      if (resolvedCoverImageUrl?.startsWith("data:")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error("Please sign in");
        }

        const blob = await fetch(resolvedCoverImageUrl).then((response) => response.blob());
        const ext = blob.type.split("/")[1] || "jpeg";
        const path = `${session.user.id}/${surfaceId}/cover-crop-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("builder-media")
          .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("builder-media")
          .getPublicUrl(path);

        resolvedCoverImageUrl = publicData.publicUrl;
        setCoverImageUrl(publicData.publicUrl);
      }

      const { error } = await supabase
        .from("builder_surfaces")
        .update({
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          favicon_url: faviconUrl || null,
          cover_image_url: resolvedCoverImageUrl,
        } as any)
        .eq("id", surfaceId);

      if (error) throw error;

      toast.success("Surface settings saved");
      onSaved?.({
        seo_title: seoTitle,
        seo_description: seoDescription,
        favicon_url: faviconUrl,
        cover_image_url: resolvedCoverImageUrl || "",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Surface Settings</DialogTitle>
          <DialogDescription>
            Edit public metadata for "{surfaceTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Page Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Page Title</Label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={surfaceTitle || "My Business Page"}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Shown in the browser tab and search results
            </p>
          </div>

          {/* SEO Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">SEO / Brand Description</Label>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Describe your business for search engines..."
              rows={3}
              className="text-sm resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              Meta description for search engines (max 160 characters)
            </p>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Favicon</Label>
            <div className="flex items-center gap-3">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-8 h-8 rounded border border-border object-contain bg-muted"
                />
              ) : (
                <div className="w-8 h-8 rounded border border-dashed border-border bg-muted flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => triggerFileInput("favicon")}
                disabled={uploadingFavicon}
              >
                {uploadingFavicon ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {faviconUrl ? "Change" : "Upload"}
              </Button>
              {faviconUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive"
                  onClick={() => setFaviconUrl("")}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Square image (32×32 or 64×64 recommended)
            </p>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Surface Cover Image</Label>
            {coverImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  onClick={() => triggerFileInput("cover")}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
                    Change cover
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-32 rounded-lg border border-dashed border-border bg-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => triggerFileInput("cover")}
              >
                {uploadingCover ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload cover image</span>
                  </>
                )}
              </div>
            )}
            {coverImageUrl && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    setCropImageSrc(coverImageUrl);
                    setShowCropDialog(true);
                  }}
                >
                  <Crop className="h-3.5 w-3.5" />
                  Resize / Reposition
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive"
                  onClick={() => setCoverImageUrl("")}
                >
                  Remove cover
                </Button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Used as your surface card image in Explore. Recommended: 1200×630
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </DialogContent>

      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageSrc={cropImageSrc}
        aspectRatio={1200 / 630}
        onCropComplete={(croppedUrl) => setCoverImageUrl(croppedUrl)}
      />
    </Dialog>
  );
}
