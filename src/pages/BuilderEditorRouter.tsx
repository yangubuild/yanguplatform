/**
 * BuilderEditorRouter — Thin routing layer that reads surface_type
 * and branches to the correct category editor.
 *
 * Seller types (emenu, eshop, store_listing, quick_site) → SellerEditor
 * live_bio → InfluencerEditorPlaceholder
 * community_group → CommunityEditorPlaceholder
 */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { lazy, Suspense } from "react";
import type { SurfaceType } from "@/types/builders";

const SellerEditor = lazy(() => import("./SellerEditor"));
const EmenuNewEditor = lazy(() => import("./EmenuNewEditor"));
const InfluencerEditorPlaceholder = lazy(() => import("./InfluencerEditorPlaceholder"));
const CommunityEditorPlaceholder = lazy(() => import("./CommunityEditorPlaceholder"));

const SELLER_TYPES = new Set(["eshop", "store_listing", "quick_site"]);

export default function BuilderEditorRouter() {
  const { surfaceId } = useParams<{ surfaceId: string }>();
  const navigate = useNavigate();

  const { data: surfaceType, isLoading, error } = useQuery({
    queryKey: ["builder-surface-type", surfaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_surfaces")
        .select("surface_type")
        .eq("id", surfaceId!)
        .single();
      if (error) throw error;
      return data.surface_type as string;
    },
    enabled: !!surfaceId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-32" />
        </header>
        <div className="flex">
          <div className="w-72 border-r border-border p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-96 max-w-md mx-auto rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !surfaceType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Could not load editor</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Surface not found"}
          </p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const fallbackLoader = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Skeleton className="h-12 w-48 rounded-lg" />
    </div>
  );

  // Branch routing by surface_type — enforces builder isolation per
  // Builder Bible Ch. 20 Rules 1–5. Each surface_type maps to exactly
  // one editor; no cross-engine module leakage is permitted.
  let EditorComponent: React.ComponentType;
  // Validated by YANGU_BUILDER_SPEC surface_type enum
  const typedSurface = surfaceType as SurfaceType;
  if (SELLER_TYPES.has(typedSurface)) {
    // eshop, store_listing, quick_site → SellerEditor
    EditorComponent = SellerEditor;
  } else if (typedSurface === "emenu") {
    EditorComponent = EmenuNewEditor;
  } else if (typedSurface === "live_bio") {
    EditorComponent = InfluencerEditorPlaceholder;
  } else if (typedSurface === "community_group") {
    EditorComponent = CommunityEditorPlaceholder;
  } else {
    // Unknown / legacy surface types fall back to the unified Emenu shell.
    EditorComponent = EmenuNewEditor;
  }

  return (
    <Suspense fallback={fallbackLoader}>
      <EditorComponent />
    </Suspense>
  );
}
