/**
 * Global Media Picker — single reusable component for all builder media fields.
 * Wraps the existing BuilderMediaPicker with the normalized MediaAsset type.
 */

import { BuilderMediaPicker, type MediaValue } from "../BuilderMediaPicker";

// ─── Normalized MediaAsset type ───
export interface MediaAsset {
  type: "image" | "video";
  src: string;
  provider?: "upload" | "url" | "stock" | "ai";
  thumb?: string;
  meta?: Record<string, any>;
}

// ─── Converters ───

/** Convert a legacy URL string to a MediaAsset */
export function urlToMediaAsset(url: string): MediaAsset {
  return { type: "image", src: url, provider: "url" };
}

/** Convert a string[] (legacy gallery) to MediaAsset[] */
export function legacyUrlsToMediaAssets(urls: string[]): MediaAsset[] {
  return urls.filter(Boolean).map(urlToMediaAsset);
}

/** Convert MediaAsset to the internal MediaValue used by BuilderMediaPicker */
function assetToMediaValue(asset: MediaAsset | null): MediaValue {
  if (!asset || !asset.src) return { type: "none", source: "url", url: "", alt: "" };
  const providerMap: Record<string, MediaValue["source"]> = {
    upload: "upload", url: "url", stock: "stock", ai: "ai",
  };
  return {
    type: asset.type || "image",
    source: providerMap[asset.provider || "url"] || "url",
    url: asset.src,
    alt: "",
  };
}

/** Convert internal MediaValue back to normalized MediaAsset */
function mediaValueToAsset(mv: MediaValue): MediaAsset | null {
  if (mv.type === "none" || !mv.url) return null;
  const providerMap: Record<string, MediaAsset["provider"]> = {
    upload: "upload", url: "url", stock: "stock", ai: "ai",
  };
  return {
    type: mv.type as "image" | "video",
    src: mv.url,
    provider: providerMap[mv.source] || "url",
    thumb: mv.url,
  };
}

// ─── Single Media Picker ───

interface MediaPickerProps {
  value?: MediaAsset | null;
  onChange: (next: MediaAsset | null) => void;
  allowedTypes?: ("image" | "video")[];
  label?: string;
  surfaceId: string;
}

export function MediaPicker({ value, onChange, label, surfaceId }: MediaPickerProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium">{label}</label>}
      <BuilderMediaPicker
        value={assetToMediaValue(value || null)}
        onChange={(mv) => onChange(mediaValueToAsset(mv))}
        surfaceId={surfaceId}
      />
    </div>
  );
}

export default MediaPicker;
