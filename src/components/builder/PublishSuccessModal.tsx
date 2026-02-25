/**
 * Publish Success Modal — Shows after successful publish with QR, share, copy link.
 * Uses the correct domain from engine.publishDomain.
 */

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Mail,
  QrCode,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishedUrl: string;
  surfaceTitle: string;
}

export function PublishSuccessModal({ open, onOpenChange, publishedUrl, surfaceTitle }: Props) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publishedUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publishedUrl);
    toast.success("Link copied");
  };

  const handleDownloadQr = async () => {
    try {
      const resp = await fetch(qrUrl);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${surfaceTitle.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleShare = (platform: string) => {
    const text = `Check out ${surfaceTitle}: ${publishedUrl}`;
    const encodedUrl = encodeURIComponent(publishedUrl);
    const encodedText = encodeURIComponent(text);

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      email: `mailto:?subject=${encodeURIComponent(surfaceTitle)}&body=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      tiktok: `https://www.tiktok.com/share?url=${encodedUrl}`,
      instagram: `https://www.instagram.com/`,
    };

    if (platform === "native" && navigator.share) {
      navigator.share({ title: surfaceTitle, url: publishedUrl }).catch(() => {});
      return;
    }

    const shareUrl = shareUrls[platform];
    if (shareUrl) window.open(shareUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          {/* Success icon */}
          <div className="p-3 rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold">Published! 🚀</h2>
            <p className="text-sm text-muted-foreground mt-1">Your page is now live</p>
          </div>

          {/* Published URL */}
          <Card className="w-full p-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Published to</Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-sm font-medium break-all flex-1">{publishedUrl}</code>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="w-full p-4 space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">QR Code & Share</Label>
            </div>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl border border-border bg-white">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="gap-1.5" onClick={handleDownloadQr}>
                <Download className="h-3.5 w-3.5" /> Download QR
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopyLink}>
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </Button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleShare("whatsapp")}>
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleShare("facebook")}>
                Facebook
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleShare("instagram")}>
                Instagram
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleShare("twitter")}>
                Twitter
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleShare("tiktok")}>
                TikTok
              </Button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleShare("native")}>
                  <Share2 className="h-3.5 w-3.5" /> More
                </Button>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full pt-2">
            <Button className="w-full gap-2" onClick={() => window.open(publishedUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" /> View Live Page
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
