import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useVisionaireSaves, useSaveItem, useUnsaveItem, useVisionaireItems } from "@/hooks/useVisionaireItems";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { toast } from "sonner";

export default function VisionaireBundleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: saves } = useVisionaireSaves();
  const saveItem = useSaveItem();
  const unsaveItem = useUnsaveItem();

  const { data: item, isLoading } = useQuery({
    queryKey: ["visionaire-bundle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Related items: same tags, different id, non-bundle
  const { data: relatedItems } = useVisionaireItems("master_library");

  const isSaved = saves?.some((s) => s.item_id === id) ?? false;
  const content = item?.content as any;
  const tags = (item?.tags as string[] | null) ?? [];

  if (isLoading) {
    return (
      <VisionairePageContainer>
        <div className="animate-pulse space-y-6 pt-8">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-10 w-2/3 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </VisionairePageContainer>
    );
  }

  if (!item) {
    return (
      <VisionairePageContainer>
        <div className="text-center py-20 text-muted-foreground">
          <p>Bundle not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/visionaire/bundles")}>
            Back to Bundles
          </Button>
        </div>
      </VisionairePageContainer>
    );
  }

  // Filter related by matching tags
  const related = (relatedItems ?? [])
    .filter((r) => r.id !== item.id && (r.tags as string[] | null)?.some((t) => tags.includes(t)))
    .slice(0, 8);

  return (
    <VisionairePageContainer>
      <div className="space-y-8 pb-12">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard/visionaire/bundles")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bundles
        </button>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Cover */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-[3/4] flex items-center justify-center">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" /> {tag}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{item.title}</h1>

            {content?.description && (
              <p className="text-muted-foreground leading-relaxed">{content.description}</p>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground capitalize">Bundle</p>
              </div>
              <div className="rounded-lg border border-border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground capitalize">{item.category?.replace(/_/g, " ")}</p>
              </div>
              {content?.item_count && (
                <div className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-xs text-muted-foreground">Items Included</p>
                  <p className="text-sm font-medium text-foreground">{content.item_count} products</p>
                </div>
              )}
              {item.format && (
                <div className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-sm font-medium text-foreground uppercase">{item.format}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (isSaved) {
                    unsaveItem.mutate(item.id, {
                      onSuccess: () => toast.success("Removed from saved"),
                      onError: () => toast.error("Failed"),
                    });
                  } else {
                    saveItem.mutate(item.id, {
                      onSuccess: () => toast.success("Saved"),
                      onError: () => toast.error("Failed"),
                    });
                  }
                }}
              >
                {isSaved ? (
                  <><BookmarkCheck className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Bookmark className="h-4 w-4 mr-2" /> Save Bundle</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {related.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-foreground">Related Products</h2>
            <VisionaireGrid items={related} />
          </div>
        )}
      </div>
    </VisionairePageContainer>
  );
}
