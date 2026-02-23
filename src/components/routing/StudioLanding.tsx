import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Minimal landing page for yangu.studio root.
 * All auth actions redirect to yangu.io.
 */
export function StudioLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-lg">
        <Sparkles className="h-14 w-14 mx-auto text-accent" />
        <h1 className="text-4xl font-bold tracking-tight">yangu Studio</h1>
        <p className="text-lg text-muted-foreground">
          Create ads, images, and video assets with AI.
        </p>
        <Button asChild size="lg">
          <a href="https://yangu.io/auth/login">Open yangu</a>
        </Button>
      </div>
    </div>
  );
}
