import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/primitives";
import {
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Rocket,
  ExternalLink,
  Link2,
  Copy,
  Download,
  Mail,
  Share2,
  QrCode,
} from "lucide-react";
import { useBuilderPublish, type ActiveDomain } from "@/hooks/useBuilderPublish";
import type { BuilderSurfaceType } from "@/types/builder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuilderPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceId: string;
  surfaceType: BuilderSurfaceType;
  surfaceTitle: string;
  defaultSlug?: string;
}

// Simple QR code generator using a public API
function QrCodePanel({ url, title }: { url: string; title: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

  const handleDownload = async () => {
    try {
      const resp = await fetch(qrUrl);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const handleShare = (platform: string) => {
    const text = `Check out ${title}: ${url}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      tiktok: `https://www.tiktok.com/share?url=${encodedUrl}`,
    };

    if (platform === "native" && navigator.share) {
      navigator.share({ title, url }).catch(() => {});
      return;
    }

    const shareUrl = shareUrls[platform];
    if (shareUrl) window.open(shareUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="p-3 rounded-xl border border-border bg-white">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground break-all">{url}</p>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" className="gap-1.5" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopyLink}>
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("whatsapp")}>
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("email")}>
          <Mail className="h-3.5 w-3.5" /> Email
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("facebook")}>
          Facebook
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("twitter")}>
          Twitter
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("tiktok")}>
          TikTok
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("native")}>
            <Share2 className="h-3.5 w-3.5" /> More
          </Button>
        )}
      </div>
    </div>
  );
}

export function BuilderPublishModal({
  open,
  onOpenChange,
  surfaceId,
  surfaceType,
  surfaceTitle,
  defaultSlug,
}: BuilderPublishModalProps) {
  const {
    allowedDomains,
    domainsLoading,
    selectedDomainId,
    setSelectedDomainId,
    selectedDomain,
    customSlug,
    setCustomSlug,
    isPublishing,
    publishResult,
    publishError,
    publish,
    reset,
  } = useBuilderPublish(surfaceId, surfaceType);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Auto-select first allowed domain on open
  useEffect(() => {
    if (open && allowedDomains.length > 0 && !selectedDomainId) {
      setSelectedDomainId(allowedDomains[0].id);
    }
  }, [open, allowedDomains, selectedDomainId, setSelectedDomainId]);

  // Set default slug on open
  useEffect(() => {
    if (open && defaultSlug && !customSlug) {
      setCustomSlug(defaultSlug);
    }
  }, [open, defaultSlug, customSlug, setCustomSlug]);

  // Meta fields state (must be before any early returns)
  const [seoTitle, setSeoTitle] = useState(surfaceTitle);
  const [seoDescription, setSeoDescription] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const isSuccess = publishResult?.ok === true;
  const slugDisplay = customSlug || defaultSlug || "";
  const publishedUrl = selectedDomain
    ? `https://${selectedDomain.host}${slugDisplay ? `/${slugDisplay}` : ""}`
    : null;

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast.success("URL copied to clipboard");
    }
  };

  // ─── Success State ───
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Published! 🚀</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your surface is now live
              </p>
            </div>

            {/* Published URL */}
            <Card className="w-full p-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Published to</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <code className="text-sm font-medium break-all flex-1">
                  {selectedDomain?.host}{slugDisplay ? `/${slugDisplay}` : ""}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>

            {/* QR Code + Share Panel */}
            {publishedUrl && (
              <Card className="w-full p-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">QR Code & Share</Label>
                </div>
                <QrCodePanel url={publishedUrl} title={surfaceTitle} />
              </Card>
            )}

            {/* Publish ID */}
            {publishResult?.publish_id && (
              <p className="text-xs text-muted-foreground">
                Publish ID: <code className="font-mono">{publishResult.publish_id}</code>
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full pt-2">
              {publishedUrl && (
                <Button
                  className="w-full gap-2"
                  onClick={() => window.open(publishedUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Page
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Main State ───

  const handleMetaUpload = async (file: File, type: "favicon" | "cover") => {
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
      const { data: publicData } = supabase.storage.from("builder-media").getPublicUrl(path);
      setter(publicData.publicUrl);
      toast.success(`${type === "favicon" ? "Favicon" : "Cover"} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerMetaUpload = (type: "favicon" | "cover") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "cover" ? "image/*,video/*,.gif" : "image/*";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleMetaUpload(f, type);
    };
    input.click();
  };

  const handlePublishWithMeta = async () => {
    // Save metadata to surface first
    try {
      await supabase
        .from("builder_surfaces")
        .update({
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          favicon_url: faviconUrl || null,
          cover_image_url: coverImageUrl || null,
        } as any)
        .eq("id", surfaceId);
    } catch {}
    // Then publish
    publish();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Publish Surface
          </DialogTitle>
          <DialogDescription>
            Choose a domain to publish "{surfaceTitle}" on
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Page Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Page Title</Label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={surfaceTitle || "My Page"}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Shown in browser tab</p>
          </div>

          {/* SEO Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">SEO Description</Label>
            <Input
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Describe your page..."
              className="text-sm"
            />
          </div>

          {/* Favicon */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Favicon</Label>
            <div className="flex items-center gap-2">
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="w-6 h-6 rounded border border-border object-contain" />
              ) : (
                <div className="w-6 h-6 rounded border border-dashed border-border bg-muted" />
              )}
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => triggerMetaUpload("favicon")} disabled={uploadingFavicon}>
                {uploadingFavicon ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {faviconUrl ? "Change" : "Upload"}
              </Button>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Cover Image</Label>
            {coverImageUrl ? (
              <div className="relative rounded overflow-hidden border border-border cursor-pointer" onClick={() => triggerMetaUpload("cover")}>
                {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(coverImageUrl) || coverImageUrl.startsWith("data:video/") ? (
                  <video src={coverImageUrl} className="w-full h-20 object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img src={coverImageUrl} alt="Cover" className="w-full h-20 object-cover" />
                )}
              </div>
            ) : (
              <div
                className="w-full h-20 rounded border border-dashed border-border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80"
                onClick={() => triggerMetaUpload("cover")}
              >
                {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <span className="text-xs text-muted-foreground">Upload cover</span>}
              </div>
            )}
          </div>

          {/* Domain Picker */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Domain</label>

            {domainsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allowedDomains.length === 0 ? (
              <Card className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No eligible domains for this surface type.
                </p>
              </Card>
            ) : (
              <div className="grid gap-2">
                {allowedDomains.map((domain: ActiveDomain) => (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomainId(domain.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedDomainId === domain.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        selectedDomainId === domain.id ? "bg-accent/10" : "bg-muted"
                      }`}
                    >
                      <Globe
                        className={`h-4 w-4 ${
                          selectedDomainId === domain.id
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <p className="font-medium truncate flex-1">{domain.host}</p>
                    {selectedDomainId === domain.id && (
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Slug Input */}
          {selectedDomain && (
            <div className="space-y-2">
              <Label htmlFor="builder-slug" className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Slug
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  {selectedDomain.host}/
                </span>
                <Input
                  id="builder-slug"
                  placeholder={defaultSlug || "my-page"}
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be the URL where your page is accessible
              </p>
            </div>
          )}

          {/* Error */}
          {publishError && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{publishError}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublishWithMeta}
            disabled={!selectedDomainId || isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
