import { useState } from "react";
import { Image, Eye, EyeOff, RotateCcw, Upload, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingBanners, useBannerMutations } from "@/hooks/landing/useLandingBanners";
import { BANNER_CONTRACT } from "@/lib/bannerContracts";
import type { BannerSlot } from "@/lib/bannerContracts";
import { toast } from "sonner";

function BannerCard({
  slot,
  label,
  isSystem,
  data,
  onToggle,
  onUpdateImage,
  onRemoveImage,
}: {
  slot: BannerSlot;
  label: string;
  isSystem?: boolean;
  data: { headline?: string | null; subheadline?: string | null; image_url?: string | null; is_active?: boolean };
  onToggle?: () => void;
  onUpdateImage?: (url: string) => void;
  onRemoveImage?: () => void;
}) {
  const [imageInput, setImageInput] = useState("");

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "hsl(var(--border))",
        background: isSystem ? "hsl(var(--muted) / 0.3)" : "hsl(var(--card))",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSystem ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Image className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm text-foreground">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {isSystem ? "System (locked)" : data.is_active ? "Active" : "Hidden"}
          </span>
        </div>
        {!isSystem && onToggle && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="gap-1.5">
            {data.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {data.is_active ? "Hide" : "Show"}
          </Button>
        )}
      </div>

      {/* Locked dimensions display */}
      <div className="text-xs text-muted-foreground mb-3 flex gap-4">
        <span>Min height: {BANNER_CONTRACT.minHeight}px</span>
        <span>Radius: 16px (2xl)</span>
        <span>Width: 100% (max 1100px)</span>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg overflow-hidden mb-3"
        style={{
          height: 120,
          background: data.image_url
            ? `url(${data.image_url}) center/cover`
            : BANNER_CONTRACT.defaultBg,
          border: BANNER_CONTRACT.borderStyle,
        }}
      >
        <div className="h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {data.headline || "No headline"}
          </span>
        </div>
      </div>

      {/* Editable controls */}
      {!isSystem && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Paste image URL..."
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!imageInput.trim()}
            onClick={() => {
              onUpdateImage?.(imageInput.trim());
              setImageInput("");
              toast.success("Banner image updated");
            }}
            className="gap-1"
          >
            <Upload className="w-3.5 h-3.5" /> Set
          </Button>
          {data.image_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onRemoveImage?.();
                toast.success("Banner image removed");
              }}
              className="gap-1 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManageBanners() {
  const { data: banners, isLoading } = useLandingBanners();
  const { upsert, remove, restore } = useBannerMutations();

  const handleToggle = (slot: "middle" | "lower") => {
    const banner = banners?.[slot];
    if (!banner) return;
    if (banner.is_active) {
      remove.mutate(slot);
      toast.success(`Banner ${slot} hidden`);
    } else {
      restore.mutate(slot);
      toast.success(`Banner ${slot} restored`);
    }
  };

  const handleUpdateImage = (slot: "middle" | "lower", url: string) => {
    upsert.mutate({ slot, image_url: url });
  };

  const handleRemoveImage = (slot: "middle" | "lower") => {
    upsert.mutate({ slot, image_url: null });
  };

  return (
    <div>
      <div className="flex items-center gap-2 px-6 pt-6 pb-2">
        <Image className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Landing Banners</h1>
      </div>

      <div className="p-6 space-y-4 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-2">
          The landing page has 3 hero banners. Banner 1 is a fixed system banner. Banners 2 and 3 are editable.
        </p>

        {/* Banner 1: System (locked) */}
        <BannerCard
          slot="system"
          label="Banner 1 — System Hero"
          isSystem
          data={{
            headline: "Build and. Sell Online.",
            subheadline: "Your all-in-one platform to build, market, and scale a business.",
            is_active: true,
          }}
        />

        {/* Banner 2: Editable */}
        <BannerCard
          slot="middle"
          label="Banner 2 — Enterprise"
          data={{
            headline: banners?.middle.headline,
            subheadline: banners?.middle.subheadline,
            image_url: banners?.middle.image_url,
            is_active: banners?.middle.is_active ?? true,
          }}
          onToggle={() => handleToggle("middle")}
          onUpdateImage={(url) => handleUpdateImage("middle", url)}
          onRemoveImage={() => handleRemoveImage("middle")}
        />

        {/* Banner 3: Editable */}
        <BannerCard
          slot="lower"
          label="Banner 3 — Treasury"
          data={{
            headline: banners?.lower.headline,
            subheadline: banners?.lower.subheadline,
            image_url: banners?.lower.image_url,
            is_active: banners?.lower.is_active ?? true,
          }}
          onToggle={() => handleToggle("lower")}
          onUpdateImage={(url) => handleUpdateImage("lower", url)}
          onRemoveImage={() => handleRemoveImage("lower")}
        />
      </div>
    </div>
  );
}
