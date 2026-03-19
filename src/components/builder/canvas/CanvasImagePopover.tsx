/**
 * CanvasImagePopover — inline image click opens direct upload immediately.
 * No popover menu is shown. Advanced options (stock/AI/URL) live in the right-side editor.
 */

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
    input.accept = "image/*,video/*";
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

  return (
    <div
      className={`relative group/img cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center">
        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
          Click to upload
        </span>
      </div>
    </div>
  );
}
