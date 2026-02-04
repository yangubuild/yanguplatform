import { Sparkles, Share2, Eye } from "lucide-react";
import { Banner } from "@/components/primitives";

export function StudioInfoBanner() {
  return (
    <Banner variant="default" className="mb-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span><strong>Generate content</strong> (uses credits)</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-success" />
          <span><strong>Sharing studio links</strong> is free</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-success" />
          <span><strong>Viewing studio albums</strong> is free</span>
        </div>
      </div>
    </Banner>
  );
}
