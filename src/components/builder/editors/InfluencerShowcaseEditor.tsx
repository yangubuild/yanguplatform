import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { MediaPicker, type MediaAsset } from "../media/MediaPicker";

interface ShowcaseItem {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
}

interface InfluencerShowcaseEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

export function InfluencerShowcaseEditor({ schema, update, surfaceId }: InfluencerShowcaseEditorProps) {
  const items = ((schema.showcase_items as ShowcaseItem[]) || []) as ShowcaseItem[];
  const displayMode = (schema.showcase_display as string) || "carousel";

  const updateItem = (index: number, partial: Partial<ShowcaseItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...partial };
    update({ showcase_items: updated });
  };

  const removeItem = (index: number) => {
    update({ showcase_items: items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    update({
      showcase_items: [...items, { title: "", description: "", image_url: "", link_url: "" }],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Creator Showcase</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Feature products, gear, or content</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Display Style</Label>
        <Select value={displayMode} onValueChange={(v) => update({ showcase_display: v })}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="carousel">Carousel (horizontal scroll)</SelectItem>
            <SelectItem value="list">Product List (accordion)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
            <MediaPicker
              label="Image"
              value={item.image_url ? { type: "image", src: item.image_url, provider: "url" } : null}
              onChange={(asset) => updateItem(i, { image_url: asset?.src || "" })}
              surfaceId={surfaceId || ""}
            />
            <Input placeholder="Title" value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} className="text-sm" />
            <Textarea placeholder="Short description (2 lines max)" value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} rows={2} className="text-sm" />
            <Input placeholder="Link URL (optional)" value={item.link_url} onChange={(e) => updateItem(i, { link_url: e.target.value })} className="text-sm" />
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" /> Add Showcase Item
      </Button>
    </div>
  );
}
