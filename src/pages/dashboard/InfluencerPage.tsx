import { useEffect } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { Loader2 } from "lucide-react";

/**
 * When user navigates to /dashboard/influencer, find-or-create their
 * live_bio surface and immediately redirect to /builder/:surfaceId.
 */
export default function InfluencerPage() {
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();

  useEffect(() => {
    initAndNavigate({
      surfaceType: "live_bio",
      slug: "profile",
      title: "My Influencer Page",
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isInitializing ? "Setting up your Influencer page…" : "Redirecting to editor…"}
      </p>
    </div>
  );
}
