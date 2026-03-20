import { useState } from "react";
import { Crop, Upload } from "lucide-react";
import { ImageCropDialog } from "../ImageCropDialog";

interface HeroImagePositionerProps {
  src: string;
  alt?: string;
  className?: string;
  onImageChange: (newUrl: string) => void;
  onImageReplace?: () => void;
  onRemove?: () => void;
}

/**
 * Hero image with click-to-show options matching the Surface Cover Image UX:
 *   1. Resize / Reposition → opens ImageCropDialog
 *   2. Replace Image → opens file picker
 */
export function HeroImagePositioner({
  src,
  alt = "Hero image",
  className = "",
  onImageChange,
  onImageReplace,
  onRemove,
}: HeroImagePositionerProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) {
      onImageReplace?.();
      return;
    }
    setShowOptions((prev) => !prev);
  };

  if (!src) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground text-xs cursor-pointer ${className}`}
        onClick={handleImageClick}
      >
        <Upload className="h-5 w-5 mr-1.5" />
        Click to upload
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative group/hero-img cursor-pointer ${className}`}
        onClick={handleImageClick}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-full object-cover"
        />

        {/* Hover hint */}
        {!showOptions && (
          <div className="absolute inset-0 bg-black/0 group-hover/hero-img:bg-black/30 transition-all flex items-center justify-center">
            <span className="opacity-0 group-hover/hero-img:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
              Click to edit
            </span>
          </div>
        )}

        {/* Two-option overlay */}
        {showOptions && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
            onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
          >
            <div
              className="flex flex-col gap-1 bg-background/95 backdrop-blur-md rounded-xl shadow-lg border border-border p-2 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(false);
                  setShowCropDialog(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Crop className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Resize / Reposition</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(false);
                  onImageReplace?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Replace Image</span>
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(false);
                    onRemove();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm font-medium text-destructive">Remove Image</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageSrc={src}
        onCropComplete={(croppedUrl) => onImageChange(croppedUrl)}
      />
    </>
  );
}
