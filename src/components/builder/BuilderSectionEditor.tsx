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

interface BuilderSectionEditorProps {
  section: EditorSection;
  onClose: () => void;
  onSave: (sectionId: string, schema: Record<string, unknown>) => Promise<void>;
  onToggleVisibility: (sectionId: string, visible: boolean) => Promise<void>;
  isSaving: boolean;
  surfaceType: string;
  surfaceId?: string;
}

// ─── Helpers ───

function TextField({ label, value, onChange, multiline = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
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
      <TextField label="Headline" value={(schema.headline as string) || ""} onChange={(v) => update({ headline: v })} />
      <TextField label="Subheadline" value={(schema.subheadline as string) || ""} onChange={(v) => update({ subheadline: v })} />
      <TextField label="CTA Text" value={(schema.cta_text as string) || ""} onChange={(v) => update({ cta_text: v })} />
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

// ─── Header / Logo form (replaces QR) ───
function HeaderForm({ schema, update, surfaceId }: FormProps & { surfaceId?: string }) {
  const logoUrl = (schema.logo_url as string) || "";
  const logoPosition = (schema.logo_position as string) || "left";
  const logoSize = (schema.logo_size as string) || "medium";
  const showName = schema.show_name !== false;
  const nameNextToLogo = schema.name_next_to_logo !== false;

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">Logo URL</Label>
        <Input
          value={logoUrl}
          onChange={(e) => update({ logo_url: e.target.value })}
          placeholder="Paste image URL or upload in editor"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">Upload or generate with AI</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Logo Position</Label>
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
          <Label className="text-xs">Logo Size</Label>
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

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-name"
            checked={showName}
            onCheckedChange={(checked) => update({ show_name: !!checked })}
          />
          <label htmlFor="show-name" className="text-xs font-medium">Show Business Name</label>
        </div>
        {showName && (
          <div className="flex items-center gap-2 ml-5">
            <Checkbox
              id="name-next-to-logo"
              checked={nameNextToLogo}
              onCheckedChange={(checked) => update({ name_next_to_logo: !!checked })}
            />
            <label htmlFor="name-next-to-logo" className="text-xs text-muted-foreground">
              Display name next to logo
            </label>
          </div>
        )}
      </div>
    </>
  );
}

function FeaturedForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Title" value={(schema.title as string) || ""} onChange={(v) => update({ title: v })} />
      <ListEditor
        label="Featured Items"
        items={((schema.items as any[]) || []) as Array<{ title: string; description: string; image_url: string; href: string }>}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description" },
          { key: "image_url", label: "Image URL", placeholder: "https://..." },
          { key: "href", label: "Link URL", placeholder: "https://..." },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ title: "", description: "", image_url: "", href: "" }}
      />
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

function ItemListForm({ schema, update, heading }: FormProps & { heading?: string }) {
  return (
    <>
      <TextField label="Heading" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ListEditor
        label={heading || "Items"}
        items={((schema.items as any[]) || []) as Array<{ name: string; price: string; description: string }>}
        fields={[
          { key: "name", label: "Name" },
          { key: "price", label: "Price (optional)", placeholder: "$0" },
          { key: "description", label: "Description (optional)" },
        ]}
        onChange={(v) => update({ items: v })}
        emptyItem={{ name: "", price: "", description: "" }}
      />
    </>
  );
}

// ─── Menu form (proper categories + items with currency) ───
function MenuForm({ schema, update }: FormProps) {
  const categories = ((schema.categories as any[]) || []) as Array<{ name: string; items: Array<{ name: string; price: string; description: string }> }>;
  const currency = (schema.currency as string) || "$";

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

      {categories.map((cat, ci) => (
        <div key={ci} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={cat.name}
              onChange={(e) => {
                const updated = [...categories];
                updated[ci] = { ...updated[ci], name: e.target.value };
                update({ categories: updated });
              }}
              placeholder="Category name"
              className="text-sm font-medium flex-1"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
              update({ categories: categories.filter((_, j) => j !== ci) });
            }}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          {(cat.items || []).map((item, ii) => (
            <div key={ii} className="flex gap-2 items-start ml-2">
              <div className="flex-1 space-y-1">
                <Input value={item.name} onChange={(e) => {
                  const updated = [...categories];
                  const items = [...(updated[ci].items || [])];
                  items[ii] = { ...items[ii], name: e.target.value };
                  updated[ci] = { ...updated[ci], items };
                  update({ categories: updated });
                }} placeholder="Item name" className="text-sm" />
                <div className="flex gap-2">
                  <Input value={item.price} onChange={(e) => {
                    const updated = [...categories];
                    const items = [...(updated[ci].items || [])];
                    items[ii] = { ...items[ii], price: e.target.value };
                    updated[ci] = { ...updated[ci], items };
                    update({ categories: updated });
                  }} placeholder={`${currency}0`} className="text-sm w-24" />
                  <Input value={item.description || ""} onChange={(e) => {
                    const updated = [...categories];
                    const items = [...(updated[ci].items || [])];
                    items[ii] = { ...items[ii], description: e.target.value };
                    updated[ci] = { ...updated[ci], items };
                    update({ categories: updated });
                  }} placeholder="Description (optional)" className="text-sm flex-1" />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mt-0.5" onClick={() => {
                const updated = [...categories];
                updated[ci] = { ...updated[ci], items: (updated[ci].items || []).filter((_, j) => j !== ii) };
                update({ categories: updated });
              }}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full text-xs gap-1 ml-2" onClick={() => {
            const updated = [...categories];
            updated[ci] = { ...updated[ci], items: [...(updated[ci].items || []), { name: "", price: "", description: "" }] };
            update({ categories: updated });
          }}>
            <Plus className="h-3 w-3" /> Add Item
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => {
        update({ categories: [...categories, { name: "", items: [] }] });
      }}>
        <Plus className="h-3.5 w-3.5" /> Add Category
      </Button>
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

function GalleryForm({ schema, update }: FormProps) {
  const items = ((schema.items as any[]) || []) as Array<{ url: string }>;
  return (
    <ListEditor
      label="Image URLs"
      items={items}
      fields={[{ key: "url", label: "Image URL", placeholder: "https://..." }]}
      onChange={(v) => update({ items: v })}
      emptyItem={{ url: "" }}
    />
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
  header: HeaderForm,
  featured: FeaturedForm,
  bio: BioForm,
  text: TextForm,
  about: AboutForm,
  links: LinksForm,
  social: SocialForm,
  cta: CtaForm,
  join: JoinForm,
  offer: OfferForm,
  plans: PlansForm,
  faq: FaqForm,
  contact: ContactForm,
  footer: FooterForm,
  gallery: GalleryForm,
  menu: MenuForm,
  hours: HoursForm,
  location: LocationForm,
  products: (p) => <ItemListForm {...p} heading="Products" />,
  services: (p) => <ItemListForm {...p} heading="Services" />,
  listings: (p) => <ItemListForm {...p} heading="Listings" />,
};

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero Banner", header: "Header / Logo", featured: "Featured", bio: "Bio", links: "Links", social: "Socials", cta: "CTA",
  video: "Video", gallery: "Gallery", text: "Text", products: "Products",
  services: "Services", testimonials: "Testimonials", contact: "Contact",
  faq: "FAQ", menu: "Menu", schedule: "Schedule", about: "About",
  offer: "Offers", plans: "Plans", join: "Join", listings: "Listings",
  hours: "Opening Hours", location: "Location", footer: "Footer",
};

// ─── Main component ───

export function BuilderSectionEditor({
  section, onClose, onSave, onToggleVisibility, isSaving, surfaceType, surfaceId,
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
    setLocalSchema((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }, []);

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
          <p className="text-sm text-muted-foreground italic">
            No editable fields for "{label}" section type.
          </p>
        )}
      </div>

      {/* Save button */}
      {FormComponent && (
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
      )}
    </aside>
  );
}
