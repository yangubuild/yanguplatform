import { useState, useRef } from "react";
import { X, Upload, FolderOpen, Cloud, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}

type Tab = "upload" | "library" | "stock" | "generate";

export function MediaSourcePicker({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Add Media</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {([
            { key: "upload" as Tab, icon: Upload, label: "Upload" },
            { key: "library" as Tab, icon: FolderOpen, label: "Library" },
            { key: "stock" as Tab, icon: Cloud, label: "Stock" },
            { key: "generate" as Tab, icon: Sparkles, label: "Generate" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t.key ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
          {tab === "upload" && <UploadTab onSelect={onSelect} />}
          {tab === "library" && <LibraryTab onSelect={onSelect} />}
          {tab === "stock" && <StockTab />}
          {tab === "generate" && <GenerateTab />}
        </div>
      </div>
    </div>
  );
}

function UploadTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `social-media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      onSelect(urls);
      toast.success("Media uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="flex flex-col items-center justify-center h-full min-h-[240px] border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/40 transition-colors"
    >
      <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={handleUpload} className="hidden" />
      {uploading ? (
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Click to upload</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4 up to 50MB</p>
        </>
      )}
    </div>
  );
}

function LibraryTab({ onSelect }: { onSelect: (urls: string[]) => void }) {
  // Placeholder - connects to social library assets
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[240px]">
      <FolderOpen className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">Your Library</p>
      <p className="text-xs text-muted-foreground">Library media will appear here</p>
    </div>
  );
}

function StockTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[240px]">
      <Cloud className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">Stock Photos</p>
      <p className="text-xs text-muted-foreground">Search free stock photos coming soon</p>
    </div>
  );
}

function GenerateTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[240px]">
      <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">AI Image Generation</p>
      <p className="text-xs text-muted-foreground">Generate images with AI coming soon</p>
    </div>
  );
}
