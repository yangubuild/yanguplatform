/**
 * Studio Asset Gallery — grid of all user's studio assets with filters + download.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Video,
  FileText,
  Music,
  Loader2,
  Coins,
  Filter,
} from "lucide-react";
import { useStudioAssets, useDownloadAsset, type StudioAsset } from "@/hooks/useStudioAssets";
import { useCredits } from "@/hooks/useCredits";

const ASSET_TYPE_FILTERS = [
  { key: "", label: "All", icon: Filter },
  { key: "image", label: "Images", icon: ImageIcon },
  { key: "video", label: "Videos", icon: Video },
  { key: "script", label: "Scripts", icon: FileText },
  { key: "audio", label: "Audio", icon: Music },
] as const;

function getAssetIcon(type: string) {
  switch (type) {
    case "video": return Video;
    case "script": return FileText;
    case "audio": return Music;
    default: return ImageIcon;
  }
}

export default function StudioAssetGallery() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("");
  const { data: assets, isLoading } = useStudioAssets({ assetType: typeFilter || undefined });
  const { data: credits } = useCredits();
  const downloadAsset = useDownloadAsset();

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/dashboard/studio")}
          className="p-2 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1
            className="text-xl font-black uppercase tracking-tight text-foreground"
            style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
            Asset Gallery
          </h1>
          <p className="text-sm text-muted-foreground">All your Studio-generated assets</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-accent font-semibold">
          <Coins className="h-4 w-4" />
          {credits?.balance ?? 0}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 pb-4 overflow-x-auto scrollbar-hide">
        {ASSET_TYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const active = typeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap border ${
                active
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-card text-muted-foreground border-border/40 hover:bg-muted/60"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="px-6 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !assets || assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No assets yet</p>
            <p className="text-xs mt-1">Generate content in Studio tools to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onDownload={() => downloadAsset.mutate(asset.id)}
                isDownloading={downloadAsset.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onDownload,
  isDownloading,
}: {
  asset: StudioAsset;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const Icon = getAssetIcon(asset.asset_type);
  const hasThumbnail = asset.thumbnail_url || (asset.asset_type === "image" && asset.file_url);
  const thumbSrc = asset.thumbnail_url || asset.file_url || "";

  return (
    <div className="group relative rounded-xl overflow-hidden border border-border/40 bg-card">
      {/* Thumbnail / placeholder */}
      <div className="aspect-square bg-muted/30 flex items-center justify-center">
        {hasThumbnail ? (
          <img src={thumbSrc} alt={asset.title || ""} className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-8 h-8 text-muted-foreground/40" />
        )}
      </div>

      {/* Info bar */}
      <div className="p-3">
        <p className="text-xs font-medium text-foreground truncate">
          {asset.title || asset.generation_prompt?.slice(0, 40) || "Untitled"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{asset.asset_type}</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          disabled={isDownloading}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {asset.download_credits> 0
            ? `Download (${asset.download_credits} cr)`
            : "Download"}
        </button>
      </div>
    </div>
  );
}
