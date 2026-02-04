import { Download, Link2, Coins, Check, ExternalLink } from "lucide-react";
import { Card } from "@/components/primitives";
import { PrimaryButton, SecondaryButton } from "@/components/primitives";
import { toast } from "sonner";

interface StudioOutputOptionsProps {
  onDownload: () => void;
  onGenerateLink: () => void;
  downloadCredits: number;
  isDownloading?: boolean;
  isGeneratingLink?: boolean;
  albumUrl?: string;
}

/**
 * StudioOutputOptions - Output actions for generated content
 * 
 * LOCKED BEHAVIOR:
 * - Download Assets → uses credits (calls spend_credits RPC)
 * - Generate Studio Link → FREE (sets album_published=true, returns shareable URL)
 * 
 * NO Publish button, NO domain selector, NO KYC trigger, NO subscription gate
 */
export function StudioOutputOptions({
  onDownload,
  onGenerateLink,
  downloadCredits,
  isDownloading,
  isGeneratingLink,
  albumUrl,
}: StudioOutputOptionsProps) {
  const handleCopyLink = () => {
    if (albumUrl) {
      navigator.clipboard.writeText(`https://${albumUrl}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Download Option - USES CREDITS */}
      <Card className="p-6 border-2 hover:border-warning/50 transition-colors">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Download className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Download Assets</h3>
              <p className="text-sm text-muted-foreground">
                Save files to your device
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-sm bg-warning/10 text-warning px-3 py-2 rounded-lg">
            <Coins className="h-4 w-4 shrink-0" />
            <span><strong>Downloads use credits</strong> — costs {downloadCredits} credit{downloadCredits !== 1 ? 's' : ''}</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Download high-quality video and image files for use in your ad campaigns.
          </p>
          
          <PrimaryButton 
            onClick={onDownload} 
            disabled={isDownloading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : `Download (${downloadCredits} credits)`}
          </PrimaryButton>
        </div>
      </Card>

      {/* Share Link Option - FREE */}
      <Card className="p-6 border-2 border-success/30 hover:border-success/50 transition-colors">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Link2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Share Studio Link</h3>
              <p className="text-sm text-muted-foreground">
                Share your creatives online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-sm bg-success/10 text-success px-3 py-2 rounded-lg">
            <Check className="h-4 w-4 shrink-0" />
            <span><strong>Sharing studio links is free</strong> — no credits required</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Create a shareable album link. No website needed — sell using creatives only. Viewing studio albums is free for everyone.
          </p>
          
          {albumUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-sunken rounded-lg px-3 py-2 font-mono">
                <span className="truncate flex-1">{albumUrl}</span>
                <a 
                  href={`https://${albumUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <SecondaryButton 
                onClick={handleCopyLink}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link (Free)
              </SecondaryButton>
            </div>
          ) : (
            <SecondaryButton 
              onClick={onGenerateLink} 
              disabled={isGeneratingLink}
              className="w-full border-success/50 hover:bg-success/10"
            >
              <Link2 className="mr-2 h-4 w-4" />
              {isGeneratingLink ? "Generating..." : "Generate Free Link"}
            </SecondaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}
