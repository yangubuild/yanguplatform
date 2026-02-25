import { useEffect } from "react";
import { useBuilderSurfaceInit } from "@/hooks/useBuilderSurfaceInit";
import { Loader2 } from "lucide-react";

export default function LiveSellingPage() {
  const { initAndNavigate, isInitializing } = useBuilderSurfaceInit();

  useEffect(() => {
    initAndNavigate({
      surfaceType: "live_selling",
      slug: "live-shop",
      title: "My Live Shop",
      seedSections: [
        { type: "hero", schema: { headline: "Live Shopping", subheadline: "Watch, shop, enjoy" } },
        { type: "products", schema: { heading: "Products", items: [] } },
        { type: "cta", schema: { label: "Shop Now", href: "" } },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isInitializing ? "Setting up your Live Shop…" : "Redirecting to editor…"}
      </p>
    </div>
  );
}
