import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";

const SLOT_LABELS = [
  "Left Top Card",
  "Left Bottom Card",
  "Center Big Card",
  "Recent Pub #1 Thumb",
  "Recent Pub #2 Thumb",
  "Recent Pub #3 Thumb",
  "Recent Pub #4 Thumb",
];

const SECTION_KEY = "anthropic_research";

export function AnthropicSlotImagesPanel() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<number | null>(null);

  const { data: overrides } = useQuery({
    queryKey: ["blog-section-images", SECTION_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_section_images")
        .select("slot_key, image_url")
        .eq("section_key", SECTION_KEY);
      if (error) throw error;
      return data as { slot_key: string; image_url: string }[];
    },
  });

  const overrideMap = new Map(
    (overrides || []).map((o) => [o.slot_key, o.image_url])
  );

  const handleUpload = async (slotIndex: number, file: File) => {
    setUploading(slotIndex);
    try {
      const ext = file.name.split(".").pop();
      const path = `anthropic-covers/slot${slotIndex}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("ada-media")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("ada-media")
        .getPublicUrl(path);

      const imageUrl = urlData.publicUrl;
      const slotKey = `slot${slotIndex}`;

      const { error: dbError } = await supabase
        .from("blog_section_images")
        .upsert(
          { section_key: SECTION_KEY, slot_key: slotKey, image_url: imageUrl, updated_at: new Date().toISOString() },
          { onConflict: "section_key,slot_key" }
        );
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["blog-section-images"] });
      toast.success(`Slot ${slotIndex} image updated`);
    } catch (err) {
      toast.error("Upload failed: " + String(err));
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (slotIndex: number) => {
    const slotKey = `slot${slotIndex}`;
    const { error } = await supabase
      .from("blog_section_images")
      .delete()
      .eq("section_key", SECTION_KEY)
      .eq("slot_key", slotKey);
    if (error) {
      toast.error("Failed to remove override");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["blog-section-images"] });
    toast.success(`Slot ${slotIndex} reset to default`);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold">Section Cover Images (7 slots)</h4>
      <p className="text-xs text-muted-foreground">
        Override the default slot images. Leave empty to use defaults.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SLOT_LABELS.map((label, i) => {
          const slotNum = i + 1;
          const override = overrideMap.get(`slot${slotNum}`);
          return (
            <div key={slotNum} className="flex items-center gap-2 p-2 rounded border border-border/50 bg-muted/30">
              {override && (
                <img src={override} alt={label} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-medium">{label}</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-7 text-xs"
                    disabled={uploading === slotNum}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(slotNum, f);
                    }}
                  />
                  {override && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleRemove(slotNum)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
