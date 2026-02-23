import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Minimal landing page for yangu.live root.
 * All auth actions redirect to yangu.io.
 */
export function LiveLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-lg">
        <Radio className="h-14 w-14 mx-auto text-accent" />
        <h1 className="text-4xl font-bold tracking-tight">yangu Live</h1>
        <p className="text-lg text-muted-foreground">
          Go live, sell, and stream.
        </p>
        <Button asChild size="lg">
          <a href="https://yangu.io/auth/login">Open yangu</a>
        </Button>
      </div>
    </div>
  );
}
