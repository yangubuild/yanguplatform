import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Bookmark, BookmarkCheck, BookOpen, FileText, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { VisionaireGrid } from "@/components/visionaire/VisionaireGrid";
import { useSaveItem, useUnsaveItem, useVisionaireSaves } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";
import { getItemThumbnail, extractDriveFileId } from "@/lib/driveUtils";
import { useState } from "react";

export default function VisionaireItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const saveItem = useSaveItem();
  const unsaveItem = useUnsaveItem();
  const { data: saves } = useVisionaireSaves();

  const { data: item, isLoading } = useQuery({
    queryKey: ["visionaire-item", id],
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

  const { data: related } = useQuery({
    queryKey: ["visionaire-related", item?.category, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visionaire_items")
        .select("*")
        .eq("category", item!.category)
        .eq("is_active", true)
        .neq("id", id!)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!item?.category,
  });

  const isSaved = saves?.some((s) => s.item_id === id) ?? false;

  if (isLoading) {
    return (
      <VisionairePageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </VisionairePageContainer>
    );
  }

  if (!item) {
    return (
      <VisionairePageContainer>
        <p className="text-muted-foreground py-16 text-center">Item not found.</p>
      </VisionairePageContainer>
    );
  }

  const tags = item.tags || [];
  const content = (item.content || {}) as Record<string, any>;

  return (
    <VisionairePageContainer>
      <div className="space-y-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </button>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((t: string) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        )}

        {/* Main content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{item.title}</h1>

            {item.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            )}

            {/* Metadata stats */}
            <div className="flex flex-wrap gap-6">
              {item.page_count && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pages</p>
                    <p className="text-sm font-semibold">{item.page_count}</p>
                  </div>
                </div>
              )}
              {item.word_count && (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Words</p>
                    <p className="text-sm font-semibold">{item.word_count?.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {item.file_size && (
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-semibold">{item.file_size}</p>
                  </div>
                </div>
              )}
              {item.format && (
                <div>
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-sm font-semibold capitalize">{item.format}</p>
                </div>
              )}
            </div>

            {/* Cover preview (large) */}
            {(() => {
              const thumb = getItemThumbnail(item);
              return thumb ? (
                <div className="rounded-xl overflow-hidden border border-border bg-muted max-w-lg">
                  <img
                    src={item.preview_image_url || thumb}
                    alt={item.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : null;
            })()}

            {/* Product contents */}
            {content.lessons && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">This product contains</h3>
                <p className="text-xs text-muted-foreground">{content.lessons} lessons</p>
              </div>
            )}
          </div>

          {/* Right: Sidebar actions */}
          <div className="space-y-4">
            {/* Cover thumbnail */}
            {(() => {
              const thumb = getItemThumbnail(item);
              return thumb ? (
                <div className="rounded-xl overflow-hidden border border-border bg-muted p-4">
                  <img
                    src={thumb}
                    alt={item.title}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
              ) : null;
            })()}

            {/* Save button */}
            <Button
              variant="outline"
              className="w-full"
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
                <><Bookmark className="h-4 w-4 mr-2" /> Save Product</>
              )}
            </Button>

            {/* Download button */}
            {item.download_url && (
              <Button
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => window.open(item.download_url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download product
              </Button>
            )}

            {/* Product info card */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Product info</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>Type: <span className="capitalize text-foreground">{item.type}</span></p>
                <p>Category: <span className="capitalize text-foreground">{item.category?.replace(/_/g, " ")}</span></p>
                {item.format && <p>Format: <span className="capitalize text-foreground">{item.format}</span></p>}
              </div>
            </div>
          </div>
        </div>

        {/* Related items */}
        {related && related.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground">Related products</h2>
            <VisionaireGrid items={related} />
          </div>
        )}
      </div>
    </VisionairePageContainer>
  );
}
