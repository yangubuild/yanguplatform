import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";

const SECTION_KEY = "anthropic_research";
const SLOTS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"] as const;
const BUCKET = "blog-section-images";

interface SlotRow {
  id: string;
  slot_key: string;
  image_url: string;
}

export function AnthropicSlotImages() {
  const [slots, setSlots] = useState<Record<string, SlotRow>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from("blog_section_images")
      .select("id, slot_key, image_url")
      .eq("section_key", SECTION_KEY);
    if (data) {
      const map: Record<string, SlotRow> = {};
      data.forEach((r) => (map[r.slot_key] = r));
      setSlots(map);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleUpload = async (slotKey: string, file: File) => {
    setUploading(slotKey);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      // Use a unique path every time to bust CDN/browser cache
      const uniqueId = crypto.randomUUID();
      const path = `${SECTION_KEY}/${slotKey}/${uniqueId}.${ext}`;

      // Delete old file from storage if one exists
      const oldRow = slots[slotKey];
      if (oldRow) {
        try {
          const url = new URL(oldRow.image_url);
          const pathMatch = url.pathname.match(/\/object\/public\/blog-section-images\/(.+)/);
          if (pathMatch) {
            await supabase.storage.from(BUCKET).remove([pathMatch[1]]);
          }
        } catch { /* ignore */ }
      }

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const { error: dbErr } = await supabase
        .from("blog_section_images")
        .upsert(
          { section_key: SECTION_KEY, slot_key: slotKey, image_url: imageUrl },
          { onConflict: "section_key,slot_key" }
        );
      if (dbErr) throw dbErr;

      toast.success(`${slotKey} uploaded`);
      fetchSlots();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message ?? err}`);
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (slotKey: string) => {
    const row = slots[slotKey];
    if (!row) return;
    try {
      // Try to extract storage path from URL and delete from storage
      try {
        const url = new URL(row.image_url);
        const pathMatch = url.pathname.match(/\/object\/public\/blog-section-images\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from(BUCKET).remove([pathMatch[1]]);
        }
      } catch { /* ignore storage delete errors */ }

      await supabase
        .from("blog_section_images")
        .delete()
        .eq("id", row.id);
      toast.success(`${slotKey} removed`);
      fetchSlots();
    } catch (err: any) {
      toast.error(`Remove failed: ${err.message ?? err}`);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h4 className="text-sm font-semibold">
          Anthropic Section — Slot Images (Admin Only)
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload up to 7 images for future use in the Anthropic featured grid.
          These are NOT displayed on the public blog yet.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SLOTS.map((slot) => {
          const row = slots[slot];
          const isUploading = uploading === slot;
          return (
            <div
              key={slot}
              className="rounded-md border border-border bg-muted/30 p-2 space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {slot}
              </span>

              {row ? (
                <div className="relative w-full overflow-hidden rounded" style={{ aspectRatio: "4/3" }}>
                  <img
                    src={row.image_url}
                    alt={slot}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded bg-muted/50 text-muted-foreground"
                  style={{ aspectRatio: "4/3" }}>
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}

              <div className="flex gap-1">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(slot, f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1 text-[11px] h-7"
                    disabled={isUploading}
                    asChild>
                    <span>
                      <Upload className="h-3 w-3" />
                      {isUploading ? "…" : "Upload"}
                    </span>
                  </Button>
                </label>

                {row && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => handleRemove(slot)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
