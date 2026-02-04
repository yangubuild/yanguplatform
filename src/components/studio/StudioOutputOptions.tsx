import { Download, Link2, Coins, Check } from "lucide-react";
import { Card } from "@/components/primitives";
import { PrimaryButton, SecondaryButton } from "@/components/primitives";
import { cn } from "@/lib/utils";

interface StudioOutputOptionsProps {
  onDownload: () => void;
  onGenerateLink: () => void;
  downloadCredits: number;
  isDownloading?: boolean;
  isGeneratingLink?: boolean;
  albumUrl?: string;
}

export function StudioOutputOptions({
  onDownload,
  onGenerateLink,
  downloadCredits,
  isDownloading,
  isGeneratingLink,
  albumUrl,
}: StudioOutputOptionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Download Option - Uses Credits */}
      <Card className="p-6 border-2 hover:border-accent/50 transition-colors">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Download className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Download Assets</h3>
              <p className="text-sm text-muted-foreground">
                Save files to your device
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-sm bg-warning/10 text-warning-foreground px-3 py-2 rounded-lg">
            <Coins className="h-4 w-4" />
            <span>Uses <strong>{downloadCredits}</strong> credits</span>
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
            {isDownloading ? "Downloading..." : "Download Assets"}
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
              <h3 className="font-semibold">Generate Studio Link</h3>
              <p className="text-sm text-muted-foreground">
                Share your creatives online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4 text-sm bg-success/10 text-success px-3 py-2 rounded-lg">
            <Check className="h-4 w-4" />
            <span><strong>Free</strong> — no credits required</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Create a shareable album link. No website needed — sell using creatives only.
          </p>
          
          {albumUrl ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground bg-surface-sunken rounded-lg px-3 py-2 font-mono truncate">
                {albumUrl}
              </div>
              <SecondaryButton 
                onClick={() => navigator.clipboard.writeText(albumUrl)}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </SecondaryButton>
            </div>
          ) : (
            <SecondaryButton 
              onClick={onGenerateLink} 
              disabled={isGeneratingLink}
              className="w-full"
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
