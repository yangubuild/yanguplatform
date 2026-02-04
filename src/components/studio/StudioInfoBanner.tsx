import { Sparkles, Share2, Eye, Download } from "lucide-react";
import { Banner } from "@/components/primitives";

/**
 * StudioInfoBanner - Shows credit/free labels for all Studio actions
 * 
 * LOCKED COPY:
 * - "Generation uses credits"
 * - "Downloads use credits"
 * - "Sharing studio links is free"
 * - "Viewing studio albums is free"
 */
export function StudioInfoBanner() {
  return (
    <Banner variant="default" className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning shrink-0" />
          <span><strong>Generation</strong> uses credits</span>
        </div>
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-warning shrink-0" />
          <span><strong>Downloads</strong> use credits</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-success shrink-0" />
          <span><strong>Sharing links</strong> is free</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-success shrink-0" />
          <span><strong>Viewing albums</strong> is free</span>
        </div>
      </div>
    </Banner>
  );
}
