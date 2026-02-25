import { useEffect } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { Loader2 } from "lucide-react";

export default function StudioShowcasePage() {
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();

  useEffect(() => {
    initAndNavigate({
      surfaceType: "studio_showcase",
      slug: "my-showcase",
      title: "My Studio Showcase",
      seedSections: [
        { type: "hero", schema: { headline: "Studio Showcase", subheadline: "Our best work" } },
        { type: "gallery", schema: { heading: "Gallery", items: [] } },
        { type: "contact", schema: { heading: "Get in Touch", email: "", phone: "", address: "" } },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isInitializing ? "Setting up your Showcase…" : "Redirecting to editor…"}
      </p>
    </div>
  );
}
