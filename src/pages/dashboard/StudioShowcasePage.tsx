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
        { type: "header", schema: { logo_url: "", logo_position: "left", logo_size: "medium", show_name: true, name_next_to_logo: true }, core_slot: "header" },
        { type: "hero", schema: { headline: "Studio Showcase", subheadline: "Our best work" }, core_slot: "hero" },
        { type: "gallery", schema: { heading: "Gallery", items: [] }, core_slot: "main_content" },
        { type: "offer", schema: { heading: "What We Offer", description: "", items: [] }, core_slot: "offer" },
        { type: "footer", schema: { heading: "Footer", email: "", phone: "", address: "", hours: [], social: {} }, core_slot: "footer" },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isInitializing ? "Setting up your Showcase…" : "Redirecting to editor…"}
      </p>
    </div>
  );
}
