import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Trust-root landing for publish-container domains (shop, store, site).
 * Shows domain purpose and links back to yangu.io.
 */
export function PublishContainerLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-lg">
        <Globe className="h-14 w-14 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold tracking-tight">YANGU Publishing Domain</h1>
        <p className="text-lg text-muted-foreground">
          This domain hosts YANGU live pages.
        </p>
        <Button asChild size="lg">
          <a href="https://yangu.io/">Go to YANGU</a>
        </Button>
      </div>
    </div>
  );
}
