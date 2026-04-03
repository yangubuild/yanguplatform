import { useState, useRef, useCallback } from "react";
import { Upload, Image, Palette, X, Check } from "lucide-react";
import type { UserAssets } from "./hooks/useStepController";

interface AssetUploadStepProps {
  assets: UserAssets;
  onAssetsChange: (assets: UserAssets) => void;
  onConfirm: () => void;
}

const IMAGE_PURPOSES = [
  { value: "menu", label: "Menu / Food" },
  { value: "interior", label: "Restaurant / Interior" },
  { value: "team", label: "Team / Staff" },
  { value: "page", label: "Page / Banner" },
  { value: "other", label: "Other" },
];

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4",
  "#3B82F6", "#8B5CF6", "#EC4899", "#1A1A1A", "#6B7280",
];

export function AssetUploadStep({ assets, onAssetsChange, onConfirm }: AssetUploadStepProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedPurpose, setSelectedPurpose] = useState("menu");

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAssetsChange({ ...assets, logoUrl: url });
  }, [assets, onAssetsChange]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      purpose: selectedPurpose,
    }));
    onAssetsChange({ ...assets, images: [...assets.images, ...newImages] });
  }, [assets, onAssetsChange, selectedPurpose]);

  const toggleColor = useCallback((color: string) => {
    const current = assets.brandColors;
    const updated = current.includes(color)
      ? current.filter(c => c !== color)
      : [...current, color];
    onAssetsChange({ ...assets, brandColors: updated });
  }, [assets, onAssetsChange]);

  const removeImage = useCallback((index: number) => {
    const updated = assets.images.filter((_, i) => i !== index);
    onAssetsChange({ ...assets, images: updated });
  }, [assets, onAssetsChange]);

  const canConfirm = assets.images.length >= 1; // Relaxed minimum

  return (
    <div className="flex flex-col gap-4 w-full max-w-[88%]">
      {/* Logo Upload */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-3.5 w-3.5 text-primary" />
          <span className="text-[13px] font-semibold text-foreground">Logo</span>
        </div>
        {assets.logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={assets.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain border border-border" />
            <span className="text-xs text-muted-foreground">Logo uploaded ✓</span>
            <button
              onClick={() => onAssetsChange({ ...assets, logoUrl: undefined })}
              className="ml-auto p-1 rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => logoInputRef.current?.click()}
            className="w-full py-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Click to upload logo
          </button>
        )}
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </div>

      {/* Brand Colors */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span className="text-[13px] font-semibold text-foreground">Brand Colors</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
              style={{
                backgroundColor: color,
                borderColor: assets.brandColors.includes(color) ? "hsl(var(--primary))" : "transparent",
              }}
            >
              {assets.brandColors.includes(color) && <Check className="h-3 w-3 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Image className="h-3.5 w-3.5 text-primary" />
          <span className="text-[13px] font-semibold text-foreground">Images</span>
          <span className="text-[11px] text-muted-foreground ml-auto">{assets.images.length} uploaded</span>
        </div>

        {/* Purpose selector */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {IMAGE_PURPOSES.map(p => (
            <button
              key={p.value}
              onClick={() => setSelectedPurpose(p.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                selectedPurpose === p.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => imageInputRef.current?.click()}
          className="w-full py-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          Click to upload {IMAGE_PURPOSES.find(p => p.value === selectedPurpose)?.label || "images"}
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

        {/* Uploaded images preview */}
        {assets.images.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {assets.images.map((img, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden aspect-square group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removeImage(i)} className="p-1 rounded-full bg-white/20">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-[9px] text-white text-center py-0.5">
                  {img.purpose}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm */}
      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="self-start px-5 py-2 text-[12px] font-semibold rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        Continue with assets ✓
      </button>
    </div>
  );
}
