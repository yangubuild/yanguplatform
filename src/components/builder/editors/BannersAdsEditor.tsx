import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone, Image, LayoutGrid, RectangleHorizontal,
  Plus, Trash2, Eye, EyeOff, Pencil, GripVertical,
} from "lucide-react";
import { BuilderMediaPicker, type MediaValue } from "../BuilderMediaPicker";

// ─── Types ───
interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  link_label: string;
}

interface BannersSchema {
  announcement_bar: {
    enabled: boolean;
    text: string;
    link_url: string;
    link_label: string;
    bg_color: string;
    text_color: string;
  };
  hero_banner: {
    enabled: boolean;
    layout: string;
    slides: BannerItem[];
    autoplay: boolean;
    interval_seconds: number;
  };
  featured_categories: {
    enabled: boolean;
    heading: string;
    layout: string;
    items: { id: string; label: string; image_url: string; link_url: string }[];
  };
  middle_banner: {
    enabled: boolean;
    banners: BannerItem[];
  };
}

interface Props {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

const uid = () => crypto.randomUUID().slice(0, 8);

function getSchema(schema: Record<string, unknown>): BannersSchema {
  return {
    announcement_bar: {
      enabled: false, text: "", link_url: "", link_label: "Shop Now",
      bg_color: "#e11d48", text_color: "#ffffff",
      ...(schema.announcement_bar as Record<string, unknown> || {}),
    },
    hero_banner: {
      enabled: true, layout: "full_width", slides: [], autoplay: true, interval_seconds: 5,
      ...(schema.hero_banner as Record<string, unknown> || {}),
    },
    featured_categories: {
      enabled: true, heading: "Shop by Category", layout: "grid", items: [],
      ...(schema.featured_categories as Record<string, unknown> || {}),
    },
    middle_banner: {
      enabled: false, banners: [],
      ...(schema.middle_banner as Record<string, unknown> || {}),
    },
  } as BannersSchema;
}

// ─── Section Card ───
function SectionCard({
  icon: Icon, title, description, enabled, onToggle, children,
}: {
  icon: React.ElementType; title: string; description: string;
  enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Announcement Bar ───
function AnnouncementSection({ data, onChange }: {
  data: BannersSchema["announcement_bar"];
  onChange: (v: BannersSchema["announcement_bar"]) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Announcement Text</Label>
        <Input value={data.text} onChange={(e) => set("text", e.target.value)}
          placeholder="🔥 Free shipping on orders over $50!" className="text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Link URL</Label>
          <Input value={data.link_url} onChange={(e) => set("link_url", e.target.value)}
            placeholder="/sale" className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Link Label</Label>
          <Input value={data.link_label} onChange={(e) => set("link_label", e.target.value)}
            placeholder="Shop Now" className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Background Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={data.bg_color} onChange={(e) => set("bg_color", e.target.value)}
              className="h-8 w-8 rounded border border-border cursor-pointer" />
            <Input value={data.bg_color} onChange={(e) => set("bg_color", e.target.value)}
              className="text-sm flex-1" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Text Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={data.text_color} onChange={(e) => set("text_color", e.target.value)}
              className="h-8 w-8 rounded border border-border cursor-pointer" />
            <Input value={data.text_color} onChange={(e) => set("text_color", e.target.value)}
              className="text-sm flex-1" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Banner Slide Editor Dialog ───
function BannerSlideDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  initial?: BannerItem; onSave: (item: BannerItem) => void;
}) {
  const [item, setItem] = useState<BannerItem>(
    initial || { id: uid(), title: "", subtitle: "", image_url: "", link_url: "", link_label: "Shop Now" }
  );
  const set = (k: string, v: string) => setItem((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Banner" : "Add Banner"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Banner Image</Label>
            <BuilderMediaPicker
              surfaceId=""
              value={item.image_url ? { type: "image", source: "url", url: item.image_url } : null}
              onChange={(v: MediaValue | null) => set("image_url", v?.url || "")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={item.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Summer Collection" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subtitle</Label>
            <Textarea value={item.subtitle} onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Up to 50% off selected items" rows={2} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Link URL</Label>
              <Input value={item.link_url} onChange={(e) => set("link_url", e.target.value)}
                placeholder="/collection/summer" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Button Label</Label>
              <Input value={item.link_label} onChange={(e) => set("link_label", e.target.value)}
                placeholder="Shop Now" className="text-sm" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(item); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hero Banner ───
function HeroBannerSection({ data, onChange }: {
  data: BannersSchema["hero_banner"];
  onChange: (v: BannersSchema["hero_banner"]) => void;
}) {
  const [editSlide, setEditSlide] = useState<BannerItem | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  const slides = (data.slides || []) as BannerItem[];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select value={data.layout} onValueChange={(v) => set("layout", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_width">Full Width</SelectItem>
              <SelectItem value="contained">Contained</SelectItem>
              <SelectItem value="split">Split (Image + Text)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Autoplay Interval</Label>
          <Select value={String(data.interval_seconds || 5)} onValueChange={(v) => set("interval_seconds", Number(v))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 seconds</SelectItem>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="8">8 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Autoplay Slides</Label>
        <Switch checked={data.autoplay} onCheckedChange={(v) => set("autoplay", v)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Slides ({slides.length})</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
            onClick={() => { setEditSlide(undefined); setDialogOpen(true); }}>
            <Plus className="h-3 w-3" /> Add Slide
          </Button>
        </div>
        {slides.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-3 text-center">No slides added yet</p>
        )}
        {slides.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 rounded-md border border-border p-2 bg-background">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {s.image_url ? (
              <img src={s.image_url} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
            ) : (
              <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{s.title || `Slide ${i + 1}`}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.subtitle || "No subtitle"}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6"
              onClick={() => { setEditSlide(s); setDialogOpen(true); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
              onClick={() => set("slides", slides.filter((_, j) => j !== i))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <BannerSlideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editSlide}
        onSave={(item) => {
          if (editSlide) {
            set("slides", slides.map((s) => s.id === item.id ? item : s));
          } else {
            set("slides", [...slides, { ...item, id: uid() }]);
          }
        }}
      />
    </>
  );
}

// ─── Featured Categories ───
function FeaturedCategoriesSection({ data, onChange }: {
  data: BannersSchema["featured_categories"];
  onChange: (v: BannersSchema["featured_categories"]) => void;
}) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  const items = (data.items || []) as BannersSchema["featured_categories"]["items"];

  const addItem = () => {
    set("items", [...items, { id: uid(), label: "", image_url: "", link_url: "" }]);
  };

  const updateItem = (idx: number, k: string, v: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [k]: v };
    set("items", updated);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Section Heading</Label>
          <Input value={data.heading} onChange={(e) => set("heading", e.target.value)}
            placeholder="Shop by Category" className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select value={data.layout} onValueChange={(v) => set("layout", v)}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="scroll">Horizontal Scroll</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Categories ({items.length})</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addItem}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={item.id} className="rounded-md border border-border p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Category {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                onClick={() => set("items", items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input value={item.label} onChange={(e) => updateItem(i, "label", e.target.value)}
              placeholder="Category name" className="text-sm" />
            <BuilderMediaPicker
              surfaceId=""
              value={item.image_url ? { type: "image", source: "url", url: item.image_url } : null}
              onChange={(v: MediaValue | null) => updateItem(i, "image_url", v?.url || "")}
            />
            <Input value={item.link_url} onChange={(e) => updateItem(i, "link_url", e.target.value)}
              placeholder="Link URL (optional)" className="text-sm" />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Middle Banner ───
function MiddleBannerSection({ data, onChange }: {
  data: BannersSchema["middle_banner"];
  onChange: (v: BannersSchema["middle_banner"]) => void;
}) {
  const [editBanner, setEditBanner] = useState<BannerItem | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const banners = (data.banners || []) as BannerItem[];

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Promotional Banners ({banners.length})</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
            onClick={() => { setEditBanner(undefined); setDialogOpen(true); }}>
            <Plus className="h-3 w-3" /> Add Banner
          </Button>
        </div>
        {banners.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center">
            <RectangleHorizontal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Add promotional banners that appear between product sections</p>
          </div>
        )}
        {banners.map((b, i) => (
          <div key={b.id} className="flex items-center gap-2 rounded-md border border-border p-2 bg-background">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {b.image_url ? (
              <img src={b.image_url} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
            ) : (
              <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{b.title || `Banner ${i + 1}`}</p>
              <p className="text-[10px] text-muted-foreground truncate">{b.subtitle || "No subtitle"}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6"
              onClick={() => { setEditBanner(b); setDialogOpen(true); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
              onClick={() => onChange({ ...data, banners: banners.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <BannerSlideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editBanner}
        onSave={(item) => {
          if (editBanner) {
            onChange({ ...data, banners: banners.map((b) => b.id === item.id ? item : b) });
          } else {
            onChange({ ...data, banners: [...banners, { ...item, id: uid() }] });
          }
        }}
      />
    </>
  );
}

// ─── Main Editor ───
export function BannersAdsEditor({ schema, update }: Props) {
  const s = getSchema(schema);

  const updateSection = (key: keyof BannersSchema, value: unknown) => {
    update({ [key]: value });
  };

  return (
    <div className="space-y-4 p-1">
      <SectionCard
        icon={Megaphone}
        title="Announcement Bar"
        description="Top banner with promotions or alerts"
        enabled={s.announcement_bar.enabled}
        onToggle={(v) => updateSection("announcement_bar", { ...s.announcement_bar, enabled: v })}
      >
        <AnnouncementSection data={s.announcement_bar} onChange={(v) => updateSection("announcement_bar", v)} />
      </SectionCard>

      <SectionCard
        icon={Image}
        title="Hero Banner"
        description="Main carousel banner at the top of your shop"
        enabled={s.hero_banner.enabled}
        onToggle={(v) => updateSection("hero_banner", { ...s.hero_banner, enabled: v })}
      >
        <HeroBannerSection data={s.hero_banner} onChange={(v) => updateSection("hero_banner", v)} />
      </SectionCard>

      <SectionCard
        icon={LayoutGrid}
        title="Featured Categories"
        description="Highlight product categories with images"
        enabled={s.featured_categories.enabled}
        onToggle={(v) => updateSection("featured_categories", { ...s.featured_categories, enabled: v })}
      >
        <FeaturedCategoriesSection data={s.featured_categories} onChange={(v) => updateSection("featured_categories", v)} />
      </SectionCard>

      <SectionCard
        icon={RectangleHorizontal}
        title="Middle Promotional Banners"
        description="Banners placed between product sections"
        enabled={s.middle_banner.enabled}
        onToggle={(v) => updateSection("middle_banner", { ...s.middle_banner, enabled: v })}
      >
        <MiddleBannerSection data={s.middle_banner} onChange={(v) => updateSection("middle_banner", v)} />
      </SectionCard>
    </div>
  );
}
