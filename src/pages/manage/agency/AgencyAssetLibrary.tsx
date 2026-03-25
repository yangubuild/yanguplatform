import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Image, Video, FileText, Megaphone, Printer, GraduationCap, FolderOpen } from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All", icon: FolderOpen },
  { key: "logos", label: "Logos", icon: Image },
  { key: "posters", label: "Posters", icon: Megaphone },
  { key: "videos", label: "Videos", icon: Video },
  { key: "social_templates", label: "Social Templates", icon: Image },
  { key: "print_materials", label: "Print Materials", icon: Printer },
  { key: "training", label: "Training", icon: GraduationCap },
] as const;

type AssetRow = {
  id: string;
  asset_type: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
};

export default function AgencyAssetLibrary() {
  const [category, setCategory] = useState("all");
  const { data: ctx } = useAgencyContext();
  const agencyId = ctx?.agency_id;

  const { data: assets, isLoading } = useQuery({
    queryKey: ["agency-assets", agencyId, category],
    queryFn: async () => {
      let q = supabase
        .from("agency_assets")
        .select("id, asset_type, title, file_url, thumbnail_url, tags, created_at")
        .or(`agency_id.is.null,agency_id.eq.${agencyId}`)
        .order("created_at", { ascending: false });

      if (category !== "all") {
        q = q.eq("asset_type", category);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as AssetRow[];
    },
    enabled: !!agencyId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Asset Library</h1>
        <p className="text-sm text-muted-foreground">Download Yangu brand assets, templates, and training materials</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={category === cat.key ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat.key)}
            className="gap-1.5"
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Assets grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : !assets?.length ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">No assets found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {category === "all"
                ? "Assets uploaded by Yangu Management will appear here"
                : `No ${CATEGORIES.find((c) => c.key === category)?.label?.toLowerCase()} assets available`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="border border-border overflow-hidden group">
              <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(asset.file_url, "_blank")}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{asset.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {asset.asset_type.replace(/_/g, " ")}
                  </Badge>
                  {asset.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
