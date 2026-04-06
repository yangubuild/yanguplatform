import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BuilderPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  category: string | null;
}

export function BuilderPublishDialog({ open, onOpenChange, businessName, category }: BuilderPublishDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const slug = (businessName || "my-site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const domain = category === "emenu" ? ".shop" : category === "eshop" ? ".shop" : ".site";
  const previewUrl = `https://${slug}${domain}`;

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publish
    await new Promise(r => setTimeout(r, 1500));
    setIsPublishing(false);
    setPublished(true);
    toast.success("Website published!");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(previewUrl);
    toast.success("URL copied!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPublished(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Publish Website
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Your URL</Label>
            <div className="flex items-center gap-2">
              <Input value={previewUrl} readOnly className="flex-1 text-sm font-mono" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {published ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Published!</span>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(previewUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" />
                Visit Site
              </Button>
            </div>
          ) : (
            <Button onClick={handlePublish} disabled={isPublishing} className="w-full gap-2">
              <Globe className="h-4 w-4" />
              {isPublishing ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
