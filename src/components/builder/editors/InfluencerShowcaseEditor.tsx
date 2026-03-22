import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { MediaPicker, type MediaAsset } from "../media/MediaPicker";
import { MediaPickerList } from "../media/MediaPickerList";
import { PaymentMethodsEditor } from "./PaymentMethodsEditor";
import { ItemCtaSelector } from "./ItemCtaSelector";

interface ShowcaseItem {
  title: string;
  description: string;
  image_url: string;
  images: string[];
  media: MediaAsset[];
  link_url: string;
  price: string;
  cta_action: string;
}

interface InfluencerShowcaseEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

const EMPTY_ITEM: ShowcaseItem = {
  title: "",
  description: "",
  image_url: "",
  images: [],
  media: [],
  link_url: "",
  price: "",
  cta_action: "buy_now",
};

/** Normalize a raw item from schema into ShowcaseItem */
function mapRawItem(raw: any): ShowcaseItem {
  const legacyImages: string[] = Array.isArray(raw.images)
    ? raw.images
    : raw.image_url
      ? [raw.image_url]
      : [];
  const existingMedia: MediaAsset[] = Array.isArray(raw.media) ? raw.media : [];
  const media: MediaAsset[] = existingMedia.length> 0
    ? existingMedia
    : legacyImages.filter(Boolean).map((url: string) => ({ type: "image" as const, src: url, provider: "url" as const }));

  return {
    ...EMPTY_ITEM,
    title: raw.title || raw.name || "",
    description: raw.description || "",
    image_url: raw.image_url || legacyImages[0] || "",
    images: legacyImages,
    media,
    link_url: raw.link_url || "",
    price: raw.price || "",
    cta_action: raw.cta_action || "buy_now",
  };
}

/** Build a legacy-compatible item for dual-field persistence */
function buildLegacyItem(item: ShowcaseItem) {
  return {
    title: item.title,
    name: item.title,
    description: item.description,
    image_url: item.media[0]?.src || item.images[0] || "",
    images: item.media.map((m) => m.src).filter(Boolean),
    media: item.media,
    link_url: item.link_url,
    price: item.price,
    cta_action: item.cta_action,
  };
}

export function InfluencerShowcaseEditor({ schema, update, surfaceId }: InfluencerShowcaseEditorProps) {
  // Read from showcase_items or items (legacy)
  const rawShowcase = Array.isArray(schema.showcase_items) ? (schema.showcase_items as any[]) : [];
  const rawLegacyItems = Array.isArray(schema.items) ? (schema.items as any[]) : [];
  const sourceItems = rawShowcase.length> 0 ? rawShowcase : rawLegacyItems;
  const isUsingLegacy = rawShowcase.length === 0 && rawLegacyItems.length> 0;

  const items = sourceItems.map(mapRawItem);
  const displayMode = (schema.showcase_display as string) || "carousel";

  /** Persist to both showcase_items and items (if legacy) */
  const persistItems = (updated: ShowcaseItem[]) => {
    const nextItems = updated.map((item) => ({
      ...item,
      images: item.media.map((m) => m.src).filter(Boolean),
      image_url: item.media[0]?.src || "",
    }));
    update({
      showcase_items: nextItems,
      ...(isUsingLegacy ? { items: updated.map(buildLegacyItem) } : {}),
    });
  };

  const updateItem = (index: number, partial: Partial<ShowcaseItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...partial };
    // Sync image_url from media if media changed
    if (partial.media) {
      updated[index].image_url = partial.media[0]?.src || "";
      updated[index].images = partial.media.map((m) => m.src).filter(Boolean);
    }
    persistItems(updated);
  };

  const removeItem = (index: number) => {
    persistItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    persistItems([...items, { ...EMPTY_ITEM }]);
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
            {/* Multi-media support (images + videos, bulk upload) */}
            <MediaPickerList
              items={item.media}
              onChange={(nextMedia) => updateItem(i, { media: nextMedia })}
              surfaceId={surfaceId || ""}
              label="Media"
              max={10}
            />
            <Input placeholder="Title" value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} className="text-sm" />
            <Textarea placeholder="Short description (2 lines max)" value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} rows={2} className="text-sm" />
            <Input placeholder="Price (optional, e.g. $29.99)" value={item.price || ""} onChange={(e) => updateItem(i, { price: e.target.value })} className="text-sm" />
            <Input placeholder="Link URL (optional)" value={item.link_url} onChange={(e) => updateItem(i, { link_url: e.target.value })} className="text-sm" />
            <ItemCtaSelector value={item.cta_action || "buy_now"} onChange={(v) => updateItem(i, { cta_action: v })} />
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" /> Add Showcase Item
      </Button>

      {/* Payment Methods */}
      <div className="border-t border-border pt-4 mt-4">
        <PaymentMethodsEditor schema={schema} update={update} />
      </div>
    </div>
  );
}
