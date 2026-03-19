/**
 * MediaPickerList — manages an array of MediaAssets (for galleries, product images, etc.)
 * Each item is a full MediaPicker with add/remove/reorder.
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Upload, Loader2 } from "lucide-react";
import { MediaPicker, type MediaAsset } from "./MediaPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaPickerListProps {
  items: MediaAsset[];
  onChange: (items: MediaAsset[]) => void;
  surfaceId: string;
  label?: string;
  allowedTypes?: ("image" | "video")[];
  max?: number;
}

export function MediaPickerList({
  items,
  onChange,
  surfaceId,
  label = "Media",
  max = 20,
}: MediaPickerListProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    // Trigger file picker directly instead of adding empty slot
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    if (items.length >= max) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to upload files");
        return;
      }
      const userId = session.user.id;
      const path = `${userId}/${surfaceId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadErr } = await supabase.storage
        .from("builder-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: publicData } = supabase.storage.from("builder-media").getPublicUrl(path);
      const newAsset: MediaAsset = { type: "image", src: publicData.publicUrl, provider: "upload" };
      onChange([...items, newAsset]);
      toast.success("Image uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const updateItem = (idx: number, asset: MediaAsset | null) => {
    const updated = [...items];
    if (asset) {
      updated[idx] = asset;
    } else {
      updated.splice(idx, 1);
    }
    onChange(updated);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...items];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    onChange(updated);
    setExpandedIdx(idx - 1);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label} ({items.length})</label>

      {items.map((item, idx) => (
        <div key={idx} className="border border-border rounded-lg overflow-hidden">
          {/* Row header */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50"
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); moveUp(idx); }} />
            {item.src ? (
              <img src={item.thumb || item.src} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                {idx + 1}
              </div>
            )}
            <span className="flex-1 text-xs truncate text-muted-foreground">
              {item.src ? (item.provider || "uploaded") : "empty — click to add"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>

          {/* Expanded picker */}
          {expandedIdx === idx && (
            <div className="p-3">
              <MediaPicker
                value={item.src ? item : null}
                onChange={(asset) => updateItem(idx, asset)}
                surfaceId={surfaceId}
              />
            </div>
          )}
        </div>
      ))}

      {/* Hidden file input for direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = "";
        }}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs"
        onClick={addItem}
        disabled={items.length >= max || uploading}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {uploading ? "Uploading..." : `Add ${label.replace(/s$/, "")}`}
      </Button>
    </div>
  );
}
