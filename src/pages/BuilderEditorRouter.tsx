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

const SellerEditor = lazy(() => import("./SellerEditor"));
const InfluencerEditorPlaceholder = lazy(() => import("./InfluencerEditorPlaceholder"));
const CommunityEditorPlaceholder = lazy(() => import("./CommunityEditorPlaceholder"));

const SELLER_TYPES = new Set(["emenu", "eshop", "store_listing", "quick_site"]);

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

  // Route based on surface_type
  if (SELLER_TYPES.has(surfaceType)) {
    return (
      <Suspense fallback={fallbackLoader}>
        <SellerEditor />
      </Suspense>
    );
  }

  if (surfaceType === "live_bio") {
    return (
      <Suspense fallback={fallbackLoader}>
        <InfluencerEditorPlaceholder />
      </Suspense>
    );
  }

  if (surfaceType === "community_group") {
    return (
      <Suspense fallback={fallbackLoader}>
        <CommunityEditorPlaceholder />
      </Suspense>
    );
  }

  // Fallback: unknown surface_type → seller editor
  return (
    <Suspense fallback={fallbackLoader}>
      <SellerEditor />
    </Suspense>
  );
}
