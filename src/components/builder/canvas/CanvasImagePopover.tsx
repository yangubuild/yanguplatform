/**
 * CanvasImagePopover — inline media click opens direct upload immediately.
 * Supports image, video, and gif. No popover menu.
 * Advanced options (stock/AI/URL) live in the right-side editor.
 */

function isVideoSrc(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:video/")) return true;
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src);
}

interface CanvasImagePopoverProps {
  src: string;
  alt?: string;
  className?: string;
  onReplace: (newUrl: string, source: "upload" | "stock" | "ai" | "url") => void;
  onRemove?: () => void;
  linkUrl?: string;
  onLinkChange?: (url: string) => void;
}

export function CanvasImagePopover({
  src,
  alt = "Image",
  className = "",
  onReplace,
}: CanvasImagePopoverProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,.gif";
    input.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
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

  const isVideo = isVideoSrc(src);

  return (
    <div
      className={`relative group/img cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {isVideo ? (
        <video src={src} className="w-full h-full object-cover" muted autoPlay loop playsInline />
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center">
        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
          Click to upload
        </span>
      </div>
    </div>
  );
}
