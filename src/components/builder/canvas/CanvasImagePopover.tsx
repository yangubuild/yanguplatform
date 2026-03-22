import { Upload } from "lucide-react";

interface CanvasImagePopoverProps {
  src: string;
  alt?: string;
  className?: string;
  onReplace: (newUrl: string, source: "upload" | "stock" | "ai" | "url") => void;
  onRemove?: () => void;
  linkUrl?: string;
  onLinkChange?: (url: string) => void;
}

/**
 * Inline canvas image — clicking triggers direct file upload only.
 * Advanced options (Stock / AI / URL) remain in the right-side editor panel.
 */
export function CanvasImagePopover({
  src,
  alt = "Image",
  className = "",
  onReplace,
}: CanvasImagePopoverProps) {

  const triggerUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onReplace(reader.result as string, "upload");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Empty / missing image → clickable placeholder
  if (!src) {
    return (
      <div
        className={`relative group/img cursor-pointer flex items-center justify-center bg-muted ${className}`}
        onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
      >
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Upload className="h-5 w-5" />
          <span className="text-[10px] font-medium">Click to upload</span>
        </div>
      </div>
    );
  }

  // Existing image → click opens direct upload
  return (
    <div
      className={`relative group/img cursor-pointer ${className}`}
      onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center">
        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-foreground text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
          Click to replace
        </span>
      </div>
    </div>
  );
}
