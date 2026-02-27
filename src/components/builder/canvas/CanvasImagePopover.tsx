import { useState } from "react";
import { Upload, Image, Sparkles, Link2, Trash2, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  onRemove,
  linkUrl,
  onLinkChange,
}: CanvasImagePopoverProps) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkInput, setLinkInput] = useState(linkUrl || "");

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onReplace(reader.result as string, "upload");
          setOpen(false);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onReplace(urlInput.trim(), "url");
      setUrlInput("");
      setShowUrl(false);
      setOpen(false);
    }
  };

  const handleLinkSubmit = () => {
    onLinkChange?.(linkInput.trim());
    setShowLink(false);
  };

  const actions = [
    { icon: Upload, label: "Upload image", onClick: handleUpload },
    { icon: Image, label: "Choose stock image", onClick: () => { onReplace("", "stock"); setOpen(false); } },
    { icon: Sparkles, label: "Generate with AI", onClick: () => { onReplace("", "ai"); setOpen(false); } },
    { icon: Link2, label: "Paste image URL", onClick: () => { setShowUrl(!showUrl); setShowLink(false); } },
    ...(onLinkChange ? [{ icon: ExternalLink, label: linkUrl ? "Edit link" : "Add link", onClick: () => { setShowLink(!showLink); setShowUrl(false); } }] : []),
    ...(onRemove ? [{ icon: Trash2, label: "Remove image", onClick: () => { onRemove(); setOpen(false); } }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={`relative group/img cursor-pointer ${className}`}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          <img src={src} alt={alt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all flex items-center justify-center">
            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
              Click to edit
            </span>
          </div>
          {linkUrl && (
            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1.5"
        side="right"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                action.icon === Trash2 ? "text-destructive hover:bg-destructive/10" : ""
              }`}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </div>
        {showUrl && (
          <div className="mt-1.5 pt-1.5 border-t border-border flex gap-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              placeholder="https://..."
              className="flex-1 text-xs px-2 py-1 rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
            <button
              onClick={handleUrlSubmit}
              className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
            >
              Go
            </button>
          </div>
        )}
        {showLink && onLinkChange && (
          <div className="mt-1.5 pt-1.5 border-t border-border space-y-1">
            <p className="text-[10px] text-muted-foreground">Link URL (opens in new tab)</p>
            <div className="flex gap-1">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                placeholder="https://..."
                className="flex-1 text-xs px-2 py-1 rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
              <button
                onClick={handleLinkSubmit}
                className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
              >
                Set
              </button>
            </div>
            {linkUrl && (
              <button
                onClick={() => { onLinkChange(""); setLinkInput(""); setShowLink(false); }}
                className="text-[10px] text-destructive hover:underline"
              >
                Remove link
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
