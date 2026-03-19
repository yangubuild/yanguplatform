import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { BuilderMediaPicker, type MediaValue } from "./BuilderMediaPicker";
import { MediaPicker, type MediaAsset, legacyUrlsToMediaAssets } from "./media/MediaPicker";
import { MediaPickerList } from "./media/MediaPickerList";
import { ProductsEditor } from "./editors/ProductsEditor";
import { BannersAdsEditor } from "./editors/BannersAdsEditor";
import { PropertiesEditor } from "./editors/PropertiesEditor";
import { BookingEditor } from "./editors/BookingEditor";
import { AiTextField } from "./AiTextField";
import { InfluencerLinksEditor } from "./editors/InfluencerLinksEditor";
import { InfluencerShowcaseEditor } from "./editors/InfluencerShowcaseEditor";
import { ItemCtaSelector } from "./editors/ItemCtaSelector";

interface BuilderSectionEditorProps {
  section: EditorSection;
  onClose: () => void;
  onSave: (sectionId: string, schema: Record<string, unknown>) => Promise<void>;
  onToggleVisibility: (sectionId: string, visible: boolean) => Promise<void>;
  onLocalSchemaChange?: (sectionId: string, schema: Record<string, unknown>) => void;
  isSaving: boolean;
  surfaceType: string;
  surfaceId?: string;
}

// ─── Helpers ───

function TextField({ label, value, onChange, multiline = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const aiEligible = multiline || /headline|subheadline|heading|title|description|body|bio|question|answer|text/i.test(label);

  if (aiEligible) {
    return (
      <AiTextField
        label={label}
        value={value}
        onChange={onChange}
        multiline={multiline}
        placeholder={placeholder}
        context={{ fieldName: label.toLowerCase().replace(/\s+/g, "_") }}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" placeholder={placeholder} />
      )}
    </div>
  );
}

function ListEditor<T extends Record<string, string>>({
  label, items, fields, onChange, emptyItem,
}: {
  label: string;
  items: T[];
  fields: { key: keyof T; label: string; placeholder?: string }[];
  onChange: (items: T[]) => void;
  emptyItem: T;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            {fields.map((f) => (
              <Input
                key={String(f.key)}
                placeholder={f.placeholder || String(f.label)}
                value={item[f.key] || ""}
                onChange={(e) => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], [f.key]: e.target.value };
                  onChange(updated);
                }}
                className="text-sm"
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 mt-0.5" onClick={() => {
            onChange(items.filter((_, j) => j !== i));
          }}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => onChange([...items, { ...emptyItem }])}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

// ─── Section-specific form renderers ───

interface FormProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
}

function HeroForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const rawMedia = (schema.media as any) || { type: "none", source: "url", url: "", alt: "" };
  const mediaValue: MediaValue = {
    type: rawMedia.type || "none",
    source: rawMedia.source || "url",
    url: rawMedia.url || "",
    provider: rawMedia.provider,
    assetId: rawMedia.assetId,
    alt: rawMedia.alt || "",
    fit: rawMedia.fit || "contain",
  };

  return (
    <>
      <AiTextField label="Headline" value={(schema.headline as string) || ""} onChange={(v) => update({ headline: v })} context={{ fieldName: "headline", sectionType: "hero_banner" }} />
      <AiTextField label="Subheadline" value={(schema.subheadline as string) || ""} onChange={(v) => update({ subheadline: v })} context={{ fieldName: "subheadline", sectionType: "hero_banner" }} />
      <AiTextField label="CTA Text" value={(schema.cta_text as string) || ""} onChange={(v) => update({ cta_text: v })} context={{ fieldName: "cta_text", sectionType: "hero_banner" }} />
      <TextField label="CTA Link" value={(schema.cta_href as string) || ""} onChange={(v) => update({ cta_href: v })} />
      <BuilderMediaPicker
        value={mediaValue}
        onChange={(v) => update({ media: v })}
        surfaceId={surfaceId || ""}
      />
      {mediaValue.type === "image" && mediaValue.url && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Image Fit</label>
          <Select value={mediaValue.fit || "contain"} onValueChange={(v) => update({ media: { ...mediaValue, fit: v as "contain" | "cover" } })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">Contain (show full image)</SelectItem>
              <SelectItem value="cover">Cover (fill area, may crop)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}

// ─── Header / Logo form ───
function HeaderForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const logoMedia = (schema.logo_media as any) || { type: "none", source: "url", url: "", alt: "" };
  const logoUrl = (schema.logo_url as string) || logoMedia.url || "";
  const logoPosition = (schema.logo_position as string) || "left";
  const logoSize = (schema.logo_size as string) || "medium";
  const showName = schema.show_name !== false;
  const nameNextToLogo = schema.name_next_to_logo !== false;
  const primaryColor = (schema.primary_color as string) || "";
  const menuLayoutStyle = (schema.menu_layout_style as string) || "list";

  // Use stored media type — don't recompute from URL presence
  const storedType = logoMedia.type || (logoUrl ? "image" : "none");

  const mediaValue: MediaValue = {
    type: storedType as MediaValue["type"],
    source: logoMedia.source || "url",
    url: logoUrl || logoMedia.url || "",
    provider: logoMedia.provider,
    assetId: logoMedia.assetId,
    alt: logoMedia.alt || "Logo",
    fit: "contain",
  };

  return (
    <>
      {/* Logo upload / pick — no Media Type selector for logo */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Logo</Label>
        {mediaValue.url && (
          <div className="mb-2 border border-border rounded-lg p-2 bg-muted/30 inline-block">
            <img src={mediaValue.url} alt="Logo preview" className="h-20 w-20 object-contain rounded" />
          </div>
        )}
        <BuilderMediaPicker
          value={mediaValue}
          onChange={(v) => {
            update({ logo_url: v.url, logo_media: v });
          }}
          surfaceId={surfaceId || ""}
          hideTypeSelector
        />
        <p className="text-xs text-muted-foreground">Recommended: Square image, max 5MB</p>
      </div>

      {/* Primary Color + Menu Layout Style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Primary Color</Label>
          <div className="flex items-center gap-2">
            <label className="relative h-9 w-9 rounded-md border border-border cursor-pointer shrink-0 overflow-hidden">
              <input
                type="color"
                value={primaryColor || "#ffffff"}
                onChange={(e) => update({ primary_color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div
                className="h-full w-full"
                style={{ backgroundColor: primaryColor || "#ffffff" }}
              />
            </label>
            <input
              value={primaryColor}
              onChange={(e) => update({ primary_color: e.target.value })}
              placeholder="#bd1f09"
              className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Menu Layout Style</Label>
          <Select value={menuLayoutStyle} onValueChange={(v) => update({ menu_layout_style: v })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="grid">Grid View</SelectItem>
              <SelectItem value="compact">Compact View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Header Layout heading */}
      <div className="border-t border-border pt-3">
        <Label className="text-sm font-semibold">Header Layout</Label>
      </div>

      {/* Logo Position + Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Logo Position</Label>
          <Select value={logoPosition} onValueChange={(v) => update({ logo_position: v })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Logo Size</Label>
          <Select value={logoSize} onValueChange={(v) => update({ logo_size: v })}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (40px)</SelectItem>
              <SelectItem value="medium">Medium (64px)</SelectItem>
              <SelectItem value="large">Large (96px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show Business Name */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Show Business Name</Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-name"
            checked={nameNextToLogo}
            onCheckedChange={(checked) => update({ name_next_to_logo: !!checked })}
          />
          <label htmlFor="show-name" className="text-xs text-muted-foreground">
            Display name next to logo
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Uncheck if your logo already includes the name</p>
      </div>
    </>
  );
}

function FeaturedForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const items = ((schema.items as any[]) || []) as Array<{ title: string; description: string; image_url: string; href: string }>;
  return (
    <>
      <TextField label="Title" value={(schema.title as string) || ""} onChange={(v) => update({ title: v })} />
      <div className="space-y-2">
        <Label className="text-xs">Featured Items</Label>
        {items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Input placeholder="Title" value={item.title || ""} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], title: e.target.value }; update({ items: u }); }} className="text-sm" />
                <Input placeholder="Description" value={item.description || ""} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], description: e.target.value }; update({ items: u }); }} className="text-sm" />
                <Input placeholder="Link URL" value={item.href || ""} onChange={(e) => { const u = [...items]; u[i] = { ...u[i], href: e.target.value }; update({ items: u }); }} className="text-sm" />
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => update({ items: items.filter((_, j) => j !== i) })}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
            <MediaPicker
              label="Image"
              value={item.image_url ? { type: "image", src: item.image_url, provider: "url" } : null}
              onChange={(asset) => { const u = [...items]; u[i] = { ...u[i], image_url: asset?.src || "" }; update({ items: u }); }}
              surfaceId={surfaceId || ""}
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => update({ items: [...items, { title: "", description: "", image_url: "", href: "" }] })}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </>
  );
}

function BioForm({ schema, update }: FormProps) {
  return <TextField label="Bio text" value={(schema.text as string) || ""} onChange={(v) => update({ text: v })} multiline />;
}

function TextForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <TextField label="Body" value={(schema.body as string) || ""} onChange={(v) => update({ body: v })} multiline />
    </>
  );
}

function AboutForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <TextField label="Body" value={(schema.body as string) || ""} onChange={(v) => update({ body: v })} multiline />
    </>
  );
}

function LinksForm({ schema, update }: FormProps) {
  const items = ((schema.items as any[]) || []) as Array<{ label: string; url: string }>;
  return (
    <ListEditor
      label="Links"
      items={items}
      fields={[
        { key: "label", label: "Label", placeholder: "My Website" },
        { key: "url", label: "URL", placeholder: "https://..." },
      ]}
      onChange={(v) => update({ items: v })}
      emptyItem={{ label: "", url: "" }}
    />
  );
}

function SocialForm({ schema, update }: FormProps) {
  const handles = (schema.handles as Record<string, string>) || {};
  const platforms = ["instagram", "tiktok", "youtube", "x", "facebook"];
  return (
    <div className="space-y-2">
      <Label className="text-xs">Social handles</Label>
      {platforms.map((p) => (
        <div key={p} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 capitalize">{p}</span>
          <Input
            value={handles[p] || ""}
            placeholder={`@handle`}
            onChange={(e) => update({ handles: { ...handles, [p]: e.target.value } })}
            className="text-sm flex-1"
          />
        </div>
      ))}
    </div>
  );
}

function CtaForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Button label" value={(schema.label as string) || ""} onChange={(v) => update({ label: v })} />
      <TextField label="URL" value={(schema.url as string) || ""} onChange={(v) => update({ url: v })} />
    </>
  );
}

function JoinForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Button label" value={(schema.label as string) || ""} onChange={(v) => update({ label: v })} />
      <TextField label="URL" value={(schema.url as string) || ""} onChange={(v) => update({ url: v })} />
      <TextField label="Description" value={(schema.description as string) || ""} onChange={(v) => update({ description: v })} multiline />
    </>
  );
}

// ─── Offers form (full editing) ───
function OfferForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const rawMedia = (schema.banner as any) || { type: "none", source: "url", url: "", alt: "" };
  const bannerValue: MediaValue = {
    type: rawMedia.type || "none",
    source: rawMedia.source || "url",
    url: rawMedia.url || "",
    provider: rawMedia.provider,
    assetId: rawMedia.assetId,
    alt: rawMedia.alt || "",
    fit: rawMedia.fit || "cover",
  };

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Banner Image / Video</Label>
        <BuilderMediaPicker
          value={bannerValue}
          onChange={(v) => update({ banner: v })}
          surfaceId={surfaceId || ""}
        />
      </div>
      <TextField label="Offer Headline" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} placeholder="e.g. Today's Special Deals" />
      <TextField label="Offer Description" value={(schema.description as string) || ""} onChange={(v) => update({ description: v })} multiline placeholder="Describe your offer..." />
      <ListEditor
        label="Offer Items"
        items={((schema.items as any[]) || []) as Array<{ title: string; price: string; description: string }>}
        fields={[
          { key: "title", label: "Title" },
          { key: "price", label: "Price", placeholder: "$0" },
          { key: "description", label: "Description" },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ title: "", price: "", description: "" }}
      />
    </>
  );
}

function PlansForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ListEditor
        label="Tiers"
        items={((schema.items as any[]) || []) as Array<{ name: string; price: string; description: string }>}
        fields={[
          { key: "name", label: "Plan name" },
          { key: "price", label: "Price", placeholder: "$9/mo" },
          { key: "description", label: "Description" },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ name: "", price: "", description: "" }}
      />
    </>
  );
}

function FaqForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ListEditor
        label="Q&A"
        items={((schema.items as any[]) || []) as Array<{ question: string; answer: string }>}
        fields={[
          { key: "question", label: "Question" },
          { key: "answer", label: "Answer" },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ question: "", answer: "" }}
      />
    </>
  );
}

function ItemListForm({ schema, update, heading, surfaceId }: FormProps & { heading?: string; surfaceId?: string }) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ItemListWithMedia
        items={((schema.items as any[]) || []) as Array<Record<string, string>>}
        onChange={(v) => update({ items: v })}
        heading={heading || "Items"}
        surfaceId={surfaceId || ""}
      />
    </>
  );
}

/** Items list that detects image/media fields and renders MediaPickerList for them */
function ItemListWithMedia({ items, onChange, heading, surfaceId }: {
  items: Array<Record<string, any>>;
  onChange: (items: Array<Record<string, any>>) => void;
  heading: string;
  surfaceId: string;
}) {
  const fields = [
    { key: "name", label: "Name" },
    { key: "price", label: "Price (optional)", placeholder: "$0" },
    { key: "description", label: "Description (optional)" },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs">{heading}</Label>
      {items.map((item, i) => {
        // Migrate legacy image_url to media[]
        const legacyUrl = item.image_url as string | undefined;
        const existingMedia: MediaAsset[] = (item.media as MediaAsset[]) || [];
        const media: MediaAsset[] = existingMedia.length > 0
          ? existingMedia
          : legacyUrl ? [{ type: "image" as const, src: legacyUrl, provider: "url" as const }] : [];

        return (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                {fields.map((f) => (
                  <Input
                    key={f.key}
                    placeholder={f.placeholder || f.label}
                    value={item[f.key] || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[i] = { ...updated[i], [f.key]: e.target.value };
                      onChange(updated);
                    }}
                    className="text-sm"
                  />
                ))}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 mt-0.5" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
            {/* CTA selector per item */}
            <ItemCtaSelector
              value={item.cta_action || "none"}
              onChange={(v) => {
                const updated = [...items];
                updated[i] = { ...updated[i], cta_action: v };
                onChange(updated);
              }}
            />
            {/* Multi-image picker per item */}
            <MediaPickerList
              items={media}
              onChange={(next) => {
                const updated = [...items];
                updated[i] = { ...updated[i], media: next, image_url: next[0]?.src || "" };
                onChange(updated);
              }}
              surfaceId={surfaceId}
              label="Images"
              max={10}
            />
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => onChange([...items, { name: "", price: "", description: "", image_url: "", media: [], cta_action: "none" }])}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

// ─── Menu form with dialog-based category & item editing ───

interface MenuCategory {
  name: string;
  icon: string;
  order: number;
  items: MenuItem[];
}

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  category_index: number;
  cta_action: string;
}

function MenuForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const categories = ((schema.categories as any[]) || []).map((c: any, i: number) => ({
    name: c.name || "",
    icon: c.icon || "🍽",
    order: c.order ?? i,
    items: (c.items || []).map((item: any) => ({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      image_url: item.image_url || "",
      is_available: item.is_available !== false,
      category_index: i,
      cta_action: item.cta_action || "order_now",
    })),
  })) as MenuCategory[];

  const currency = (schema.currency as string) || "$";

  // Dialog state
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editCatIndex, setEditCatIndex] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("🍽");
  const [catOrder, setCatOrder] = useState(0);

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editItemCatIndex, setEditItemCatIndex] = useState<number>(0);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemPhoto, setItemPhoto] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemCatSelect, setItemCatSelect] = useState<number>(0);
  const [itemCtaAction, setItemCtaAction] = useState("order_now");

  // ─── Category dialog helpers ───
  const openCreateCat = () => {
    setEditCatIndex(null);
    setCatName("");
    setCatIcon("🍽");
    setCatOrder(categories.length);
    setShowCatDialog(true);
  };

  const openEditCat = (i: number) => {
    setEditCatIndex(i);
    setCatName(categories[i].name);
    setCatIcon(categories[i].icon);
    setCatOrder(categories[i].order);
    setShowCatDialog(true);
  };

  const saveCat = () => {
    const updated = [...categories];
    const catData = { name: catName, icon: catIcon, order: catOrder, items: editCatIndex !== null ? updated[editCatIndex].items : [] };
    if (editCatIndex !== null) {
      updated[editCatIndex] = catData;
    } else {
      updated.push(catData);
    }
    update({ categories: updated });
    setShowCatDialog(false);
  };

  const deleteCat = (i: number) => {
    if (!confirm(`Delete "${categories[i].name}" and all its items?`)) return;
    update({ categories: categories.filter((_, j) => j !== i) });
  };

  // ─── Item dialog helpers ───
  const openCreateItem = (catIdx: number) => {
    setEditItemIndex(null);
    setEditItemCatIndex(catIdx);
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemPhoto("");
    setItemAvailable(true);
    setItemCatSelect(catIdx);
    setItemCtaAction("order_now");
    setShowItemDialog(true);
  };

  const openEditItem = (catIdx: number, itemIdx: number) => {
    const item = categories[catIdx].items[itemIdx];
    setEditItemIndex(itemIdx);
    setEditItemCatIndex(catIdx);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price);
    setItemPhoto(item.image_url);
    setItemAvailable(item.is_available);
    setItemCatSelect(catIdx);
    setShowItemDialog(true);
  };

  const saveItem = () => {
    const updated = [...categories];
    const newItem = { name: itemName, description: itemDesc, price: itemPrice, image_url: itemPhoto, is_available: itemAvailable, category_index: itemCatSelect };

    // If category changed during edit, move the item
    if (editItemIndex !== null) {
      // Remove from old category
      updated[editItemCatIndex] = {
        ...updated[editItemCatIndex],
        items: updated[editItemCatIndex].items.filter((_, j) => j !== editItemIndex),
      };
      // Add to selected category
      updated[itemCatSelect] = {
        ...updated[itemCatSelect],
        items: [...updated[itemCatSelect].items, newItem],
      };
    } else {
      updated[itemCatSelect] = {
        ...updated[itemCatSelect],
        items: [...updated[itemCatSelect].items, newItem],
      };
    }
    update({ categories: updated });
    setShowItemDialog(false);
  };

  const deleteItem = (catIdx: number, itemIdx: number) => {
    const updated = [...categories];
    updated[catIdx] = { ...updated[catIdx], items: updated[catIdx].items.filter((_, j) => j !== itemIdx) };
    update({ categories: updated });
  };

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <div className="space-y-1.5">
        <Label className="text-xs">Currency Symbol</Label>
        <Select value={currency} onValueChange={(v) => update({ currency: v })}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="$">$ USD</SelectItem>
            <SelectItem value="€">€ EUR</SelectItem>
            <SelectItem value="£">£ GBP</SelectItem>
            <SelectItem value="AED">AED</SelectItem>
            <SelectItem value="KES">KES</SelectItem>
            <SelectItem value="UGX">UGX</SelectItem>
            <SelectItem value="TZS">TZS</SelectItem>
            <SelectItem value="₦">₦ NGN</SelectItem>
            <SelectItem value="R">R ZAR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        {categories.length} {categories.length === 1 ? "category" : "categories"} · {totalItems} {totalItems === 1 ? "item" : "items"}
      </div>

      {/* Category list */}
      {categories.map((cat, ci) => (
        <div key={ci} className="border border-border rounded-lg overflow-hidden">
          <div
            className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 cursor-pointer hover:bg-muted/50"
            onClick={() => openEditCat(ci)}
          >
            <span className="text-base">{cat.icon}</span>
            <span className="flex-1 text-sm font-medium truncate">{cat.name || "Untitled"}</span>
            <span className="text-xs text-muted-foreground">{cat.items.length} items</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteCat(ci); }}>
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          {cat.items.length > 0 && (
            <div className="divide-y divide-border">
              {cat.items.map((item, ii) => (
                <div
                  key={ii}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/5"
                  onClick={() => openEditItem(ci, ii)}
                >
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="h-8 w-8 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name || "Untitled"}</p>
                  </div>
                  <span className="text-xs font-medium text-primary shrink-0">{currency}{item.price}</span>
                  {!item.is_available && <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">Unavailable</span>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteItem(ci, ii); }}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs gap-1 rounded-none border-t border-border"
            onClick={() => openCreateItem(ci)}
          >
            <Plus className="h-3 w-3" /> Add Item
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={openCreateCat}>
        <Plus className="h-3.5 w-3.5" /> Add Category
      </Button>

      {/* ═══ Create/Edit Category Dialog ═══ */}
      {showCatDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCatDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editCatIndex !== null ? "Edit Category" : "Create Category"}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCatDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category Name *</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g., Starters, Main Course, Desserts"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Icon/Emoji</Label>
              <Input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Display Order</Label>
              <Input type="number" value={catOrder} onChange={(e) => setCatOrder(Number(e.target.value))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCatDialog(false)}>Cancel</Button>
              <Button onClick={saveCat} disabled={!catName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Create/Edit Menu Item Dialog ═══ */}
      {showItemDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowItemDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editItemIndex !== null ? "Edit Menu Item" : "Create Menu Item"}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowItemDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Item Name *</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Margherita Pizza" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Describe your dish..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Price *</Label>
                <Input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="9.99" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Category *</Label>
                <Select value={String(itemCatSelect)} onValueChange={(v) => setItemCatSelect(Number(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {c.icon} {c.name || "Untitled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Item Photo</Label>
              {itemPhoto && (
                <div className="rounded-lg overflow-hidden border border-border mb-2">
                  <img src={itemPhoto} alt={itemName} className="w-full h-40 object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" disabled>
                  <span className="text-sm">✨</span> AI Image
                </Button>
                <BuilderMediaPicker
                  value={{ type: itemPhoto ? "image" : "none", source: "url", url: itemPhoto, alt: itemName, fit: "cover" }}
                  onChange={(v) => setItemPhoto(v.url || "")}
                  surfaceId={surfaceId || ""}
                />
              </div>
              <p className="text-xs text-muted-foreground">Choose AI generation or upload your own (min 800x600px, max 5MB)</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="item-available"
                checked={itemAvailable}
                onCheckedChange={(c) => setItemAvailable(!!c)}
              />
              <label htmlFor="item-available" className="text-sm font-medium">Item is available</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
              <Button onClick={saveItem} disabled={!itemName.trim() || !itemPrice.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HoursForm({ schema, update }: FormProps) {
  const items = ((schema.items as any[]) || []) as Array<{ day: string; hours: string }>;
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ListEditor
        label="Hours"
        items={items}
        fields={[
          { key: "day", label: "Day", placeholder: "Monday" },
          { key: "hours", label: "Hours", placeholder: "9:00 AM - 5:00 PM" },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ day: "", hours: "" }}
      />
    </>
  );
}

function LocationForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <TextField label="Address" value={(schema.address as string) || ""} onChange={(v) => update({ address: v })} />
      <TextField label="Map URL" value={(schema.mapUrl as string) || ""} onChange={(v) => update({ mapUrl: v })} placeholder="Google Maps embed URL" />
    </>
  );
}

function GalleryForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  // Legacy migration: string[] or {url:string}[] → MediaAsset[]
  const raw = schema.items as any[] | undefined;
  const items: MediaAsset[] = (raw || []).map((item: any) => {
    if (typeof item === "string") return { type: "image" as const, src: item, provider: "url" as const };
    if (item.src) return item as MediaAsset;
    if (item.url) return { type: "image" as const, src: item.url, provider: "url" as const };
    return { type: "image" as const, src: "", provider: "url" as const };
  });

  const displayMode = (schema.display_mode as string) || "grid";

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Display Mode</Label>
        <Select value={displayMode} onValueChange={(v) => update({ display_mode: v })}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
            <SelectItem value="masonry">Masonry</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MediaPickerList
        items={items}
        onChange={(next) => update({ items: next, display_mode: displayMode })}
        surfaceId={surfaceId || ""}
        label="Gallery Images"
      />
    </div>
  );
}

function ContactForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <TextField label="Email" value={(schema.email as string) || ""} onChange={(v) => update({ email: v })} placeholder="hello@example.com" />
      <TextField label="Phone" value={(schema.phone as string) || ""} onChange={(v) => update({ phone: v })} placeholder="+1 234 567 890" />
      <TextField label="Address / Location" value={(schema.address as string) || ""} onChange={(v) => update({ address: v })} placeholder="123 Main St" />
    </>
  );
}

// ─── Footer form (unified: contacts + social + hours) ───
function FooterForm({ schema, update }: FormProps) {
  const social = (schema.social as Record<string, string>) || {};
  const hours = ((schema.hours as any[]) || []) as Array<{ day: string; hours: string }>;
  const platforms = ["instagram", "tiktok", "youtube", "x", "facebook", "whatsapp"];

  return (
    <>
      <TextField label="Email" value={(schema.email as string) || ""} onChange={(v) => update({ email: v })} placeholder="hello@example.com" />
      <TextField label="Phone" value={(schema.phone as string) || ""} onChange={(v) => update({ phone: v })} placeholder="+1 234 567 890" />
      <TextField label="Address" value={(schema.address as string) || ""} onChange={(v) => update({ address: v })} placeholder="123 Main St" />

      <div className="space-y-2">
        <Label className="text-xs font-medium">Social Links</Label>
        {platforms.map((p) => (
          <div key={p} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 capitalize">{p}</span>
            <Input
              value={social[p] || ""}
              placeholder={`@handle or URL`}
              onChange={(e) => update({ social: { ...social, [p]: e.target.value } })}
              className="text-sm flex-1"
            />
          </div>
        ))}
      </div>

      <ListEditor
        label="Working Hours"
        items={hours}
        fields={[
          { key: "day", label: "Day", placeholder: "Monday" },
          { key: "hours", label: "Hours", placeholder: "9:00 AM - 5:00 PM" },
        ]}
        onChange={(v) => update({ hours: v })}
        emptyItem={{ day: "", hours: "" }}
      />
    </>
  );
}

// ─── Form map ───
const FORM_MAP: Record<string, React.ComponentType<FormProps & { surfaceId?: string }>> = {
  hero: HeroForm,
  hero_banner: HeroForm,
  header: HeaderForm,
  header_logo: HeaderForm,
  featured: FeaturedForm as React.ComponentType<FormProps & { surfaceId?: string }>,
  bio: BioForm,
  text: TextForm,
  about: AboutForm,
  links: LinksForm,
  links_grid: LinksForm,
  social: (p) => <InfluencerLinksEditor schema={p.schema} update={p.update} />,
  cta: CtaForm,
  join: JoinForm,
  offer: OfferForm,
  plans: PlansForm,
  faq: FaqForm,
  contact: ContactForm,
  footer: FooterForm,
  gallery: GalleryForm as React.ComponentType<FormProps & { surfaceId?: string }>,
  menu: MenuForm as React.ComponentType<FormProps & { surfaceId?: string }>,
  hours: HoursForm,
  location: LocationForm,
  products: ProductsEditor as React.ComponentType<FormProps & { surfaceId?: string }>,
  product_grid: ProductsEditor as React.ComponentType<FormProps & { surfaceId?: string }>,
  banners_ads: BannersAdsEditor,
  services: (p) => <ItemListForm {...p} heading="Services" surfaceId={p.surfaceId} />,
  services_list: (p) => <ItemListForm {...p} heading="Services" surfaceId={p.surfaceId} />,
  listings: (p) => <ItemListForm {...p} heading="Listings" surfaceId={p.surfaceId} />,
  listing_grid: (p) => <ItemListForm {...p} heading="Listings" surfaceId={p.surfaceId} />,
  properties: PropertiesEditor as React.ComponentType<FormProps & { surfaceId?: string }>,
  rooms: (p) => <ItemListForm {...p} heading="Rooms" surfaceId={p.surfaceId} />,
  booking_calendar: BookingEditor as React.ComponentType<FormProps & { surfaceId?: string }>,
  booking_inventory: BookingEditor as React.ComponentType<FormProps & { surfaceId?: string }>,
  programs: (p) => <ItemListForm {...p} heading="Programs" surfaceId={p.surfaceId} />,
  tours: (p) => <ItemListForm {...p} heading="Tours" surfaceId={p.surfaceId} />,
  team: (p) => <ItemListForm {...p} heading="Team Members" surfaceId={p.surfaceId} />,
  services_pricing: (p) => <ItemListForm {...p} heading="Services & Pricing" surfaceId={p.surfaceId} />,
  featured_products: (p) => <ItemListForm {...p} heading="Featured Products" surfaceId={p.surfaceId} />,
  deals: (p) => <ItemListForm {...p} heading="Deals" surfaceId={p.surfaceId} />,
  flash_sale: (p) => <ItemListForm {...p} heading="Flash Sale Items" surfaceId={p.surfaceId} />,
  reviews: (p) => <ItemListForm {...p} heading="Reviews" surfaceId={p.surfaceId} />,
  supplier_catalog: (p) => <ItemListForm {...p} heading="Supplier Catalog" surfaceId={p.surfaceId} />,
  bulk_products: (p) => <ItemListForm {...p} heading="Bulk Products" surfaceId={p.surfaceId} />,
  agriculture_produce: (p) => <ItemListForm {...p} heading="Agriculture Produce" surfaceId={p.surfaceId} />,
  manufacturer_products: (p) => <ItemListForm {...p} heading="Manufacturer Products" surfaceId={p.surfaceId} />,
  coaching: (p) => <ItemListForm {...p} heading="Coaching" surfaceId={p.surfaceId} />,
  courses: (p) => <ItemListForm {...p} heading="Courses" surfaceId={p.surfaceId} />,
  live_webinars: (p) => <ItemListForm {...p} heading="Live Webinars" surfaceId={p.surfaceId} />,
  workshops: (p) => <ItemListForm {...p} heading="Workshops" surfaceId={p.surfaceId} />,
  mentorship: (p) => <ItemListForm {...p} heading="Mentorship" surfaceId={p.surfaceId} />,
  resources: (p) => <ItemListForm {...p} heading="Resources" surfaceId={p.surfaceId} />,
  discussions: (p) => <ItemListForm {...p} heading="Discussions" surfaceId={p.surfaceId} />,
  live_stream: (p) => <ItemListForm {...p} heading="Live Stream" surfaceId={p.surfaceId} />,
  live_selling: (p) => <ItemListForm {...p} heading="Live Selling" surfaceId={p.surfaceId} />,
  affiliate_products: (p) => <ItemListForm {...p} heading="Affiliate Products" surfaceId={p.surfaceId} />,
  media_feed: (p) => <ItemListForm {...p} heading="Media Feed" surfaceId={p.surfaceId} />,
  media_grid: (p) => <ItemListForm {...p} heading="Media" surfaceId={p.surfaceId} />,
  merch: (p) => <ItemListForm {...p} heading="Merch" surfaceId={p.surfaceId} />,
  tips_support: (p) => <ItemListForm {...p} heading="Tips & Support" surfaceId={p.surfaceId} />,
  collabs: (p) => <ItemListForm {...p} heading="Collabs" surfaceId={p.surfaceId} />,
  article_feed: (p) => <ItemListForm {...p} heading="Articles" surfaceId={p.surfaceId} />,
  case_studies_grid: (p) => <ItemListForm {...p} heading="Case Studies" surfaceId={p.surfaceId} />,
  community_feed: (p) => <ItemListForm {...p} heading="Feed" surfaceId={p.surfaceId} />,
  showcase: (p) => <InfluencerShowcaseEditor schema={p.schema} update={p.update} surfaceId={p.surfaceId} />,
  creator_showcase: (p) => <InfluencerShowcaseEditor schema={p.schema} update={p.update} surfaceId={p.surfaceId} />,
};

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner", hero_banner: "Hero Banner",
  header: "Header / Logo", header_logo: "Header / Logo",
  featured: "Featured", bio: "Bio", links: "Links", links_grid: "Links",
  social: "Socials", cta: "CTA",
  video: "Video", gallery: "Gallery", text: "Text",
  products: "Products", product_grid: "Products",
  services: "Services", services_list: "Services",
  testimonials: "Testimonials", contact: "Contact",
  faq: "FAQ", menu: "Menu", schedule: "Schedule", about: "About",
  offer: "Offers", plans: "Plans", join: "Join",
  listings: "Listings", listing_grid: "Listings",
  hours: "Opening Hours", location: "Location", footer: "Footer",
  banners_ads: "Banners & Ads",
  properties: "Properties", rooms: "Rooms", booking_calendar: "Booking",
  booking_inventory: "Booking",
  programs: "Programs", tours: "Tours", team: "Team",
  services_pricing: "Services & Pricing", featured_products: "Featured Products",
  deals: "Deals", flash_sale: "Flash Sale", reviews: "Reviews",
  supplier_catalog: "Supplier Catalog", bulk_products: "Bulk Products",
  agriculture_produce: "Agriculture", manufacturer_products: "Manufacturer",
  coaching: "Coaching", courses: "Courses", live_webinars: "Live Webinars",
  workshops: "Workshops", mentorship: "Mentorship", resources: "Resources",
  discussions: "Discussions", live_stream: "Live Stream", live_selling: "Live Selling",
  affiliate_products: "Affiliate Products", media_feed: "Media Feed",
  media_grid: "Media", merch: "Merch", tips_support: "Tips & Support", collabs: "Collabs",
  article_feed: "Articles", case_studies_grid: "Case Studies",
  community_feed: "Community Feed",
  showcase: "Creator Showcase", creator_showcase: "Creator Showcase",
};

// ─── Main component ───

export function BuilderSectionEditor({
  section, onClose, onSave, onToggleVisibility, onLocalSchemaChange, isSaving, surfaceType, surfaceId,
}: BuilderSectionEditorProps) {
  const [localSchema, setLocalSchema] = useState<Record<string, unknown>>(section.schema);
  const [dirty, setDirty] = useState(false);

  // Sync from server when section changes OR when schema is updated from query invalidation
  useEffect(() => {
    if (!dirty) {
      setLocalSchema(section.schema);
    }
  }, [section.id, section.schema, dirty]);

  // Reset dirty when switching sections
  useEffect(() => {
    setDirty(false);
  }, [section.id]);

  const update = useCallback((partial: Record<string, unknown>) => {
    setLocalSchema((prev) => {
      const next = { ...prev, ...partial };
      // Notify parent for live preview
      onLocalSchemaChange?.(section.id, next);
      return next;
    });
    setDirty(true);
  }, [section.id, onLocalSchemaChange]);

  const handleSave = async () => {
    await onSave(section.id, localSchema);
    setDirty(false);
  };

  const FormComponent = FORM_MAP[section.section_type];
  const label = TYPE_LABELS[section.section_type] || section.section_type;

  return (
    <aside className="w-80 border-l border-border flex flex-col bg-sidebar overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">Edit: {label}</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Visibility toggle */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <Label className="text-xs">Visible</Label>
        <Switch
          checked={section.is_visible}
          onCheckedChange={(checked) => onToggleVisibility(section.id, checked)}
        />
      </div>

      {/* Form */}
      <div className="flex-1 p-4 space-y-4">
        {FormComponent ? (
          <FormComponent schema={localSchema} update={update} surfaceId={surfaceId} />
        ) : (
          /* GenericSectionEditor fallback — detect media fields automatically */
          <>
            <AiTextField
              label="Section Heading"
              value={(localSchema.heading as string) || ""}
              onChange={(v) => update({ heading: v })}
              placeholder="Section heading..."
              context={{ fieldName: "heading", sectionType: section.section_type }}
            />
            {typeof localSchema.description === "string" && (
              <TextField
                label="Description"
                value={localSchema.description}
                onChange={(v) => update({ description: v })}
                multiline
              />
            )}
            {/* Auto-detect media fields in schema */}
            {Object.keys(localSchema).filter(k =>
              /^(image|images|cover|media|gallery|logo|banner|photo|thumbnail|icon_url|cover_url|image_url)$/i.test(k)
            ).map((key) => {
              const val = localSchema[key];
              // Array of media
              if (Array.isArray(val)) {
                const assets: MediaAsset[] = val.map((item: any) => {
                  if (typeof item === "string") return { type: "image" as const, src: item, provider: "url" as const };
                  if (item?.src) return item as MediaAsset;
                  if (item?.url) return { type: "image" as const, src: item.url, provider: "url" as const };
                  return { type: "image" as const, src: "", provider: "url" as const };
                });
                return (
                  <MediaPickerList
                    key={key}
                    items={assets}
                    onChange={(next) => update({ [key]: next })}
                    surfaceId={surfaceId || ""}
                    label={key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  />
                );
              }
              // Single media (string URL or MediaAsset object)
              if (typeof val === "string" || (val && typeof val === "object" && !Array.isArray(val))) {
                const asset: MediaAsset | null = typeof val === "string" && val
                  ? { type: "image", src: val, provider: "url" }
                  : (val as any)?.src ? val as MediaAsset : null;
                return (
                  <MediaPicker
                    key={key}
                    label={key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    value={asset}
                    onChange={(next) => update({ [key]: next || "" })}
                    surfaceId={surfaceId || ""}
                  />
                );
              }
              return null;
            })}
            {Array.isArray(localSchema.items) && (
              <p className="text-xs text-muted-foreground">
                {(localSchema.items as unknown[]).length} item(s) configured
              </p>
            )}
          </>
        )}

        <div className="space-y-3 border border-border rounded-lg p-3">
          <Label className="text-xs font-medium">Section Appearance</Label>
          <div className="space-y-1.5">
            <Label className="text-xs">Font Family</Label>
            <Select value={(localSchema.section_font_family as string) || "default"} onValueChange={(v) => update({ section_font_family: v === "default" ? "" : v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="Lufga">Lufga</SelectItem>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="DM Sans">DM Sans</SelectItem>
                <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                <SelectItem value="Outfit">Outfit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Font Color</Label>
              <input
                type="color"
                value={(localSchema.section_font_color as string) || "#111827"}
                onChange={(e) => update({ section_font_color: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section Color</Label>
              <input
                type="color"
                value={(localSchema.section_background_color as string) || "#ffffff"}
                onChange={(e) => update({ section_background_color: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </div>
          </div>
        </div>

        {/* Button Style Controls */}
        <div className="space-y-3 border border-border rounded-lg p-3">
          <Label className="text-xs font-medium">Button Style</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Button BG</Label>
              <input
                type="color"
                value={((localSchema.button_style as any)?.bg as string) || "#000000"}
                onChange={(e) => update({ button_style: { ...((localSchema.button_style as any) || {}), bg: e.target.value } })}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button Text</Label>
              <input
                type="color"
                value={((localSchema.button_style as any)?.text as string) || "#ffffff"}
                onChange={(e) => update({ button_style: { ...((localSchema.button_style as any) || {}), text: e.target.value } })}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Border</Label>
              <input
                type="color"
                value={((localSchema.button_style as any)?.border as string) || "#000000"}
                onChange={(e) => update({ button_style: { ...((localSchema.button_style as any) || {}), border: e.target.value } })}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Radius</Label>
              <Select
                value={String(((localSchema.button_style as any)?.radius as string) || "8")}
                onValueChange={(v) => update({ button_style: { ...((localSchema.button_style as any) || {}), radius: v } })}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Square</SelectItem>
                  <SelectItem value="4">Slight</SelectItem>
                  <SelectItem value="8">Rounded</SelectItem>
                  <SelectItem value="9999">Pill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Save button — always show since GenericSectionEditor also has editable fields */}
      <div className="p-4 border-t border-border">
        <Button
          className="w-full gap-2"
          disabled={!dirty || isSaving}
          onClick={handleSave}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </aside>
  );
}
