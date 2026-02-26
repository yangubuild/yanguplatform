import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Trash2, Save, Loader2, Sparkles } from "lucide-react";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { BuilderAiFillModal } from "./BuilderAiFillModal";
import { BuilderMediaPicker, type MediaValue } from "./BuilderMediaPicker";

interface BuilderSectionEditorProps {
  section: EditorSection;
  onClose: () => void;
  onSave: (sectionId: string, schema: Record<string, unknown>) => Promise<void>;
  onToggleVisibility: (sectionId: string, visible: boolean) => Promise<void>;
  onDelete: (sectionId: string) => Promise<boolean>;
  isSaving: boolean;
  surfaceType: string;
  surfaceId?: string;
}

// ─── Helpers ───

function TextField({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
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

function OfferForm({ schema, update }: FormProps) {
  return (
    <>
      <TextField label="Title" value={(schema.heading as string) || ""} onChange={(v) => update({ heading: v })} />
      <ListEditor
        label="Items"
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
      <TextField label="Email" value={(schema.email as string) || ""} onChange={(v) => update({ email: v })} />
      <TextField label="Phone" value={(schema.phone as string) || ""} onChange={(v) => update({ phone: v })} />
      <TextField label="Address" value={(schema.address as string) || ""} onChange={(v) => update({ address: v })} />
    </>
  );
}

// ─── Form Props type ───
interface FormProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
}

const FORM_MAP: Record<string, React.ComponentType<FormProps & { surfaceId?: string }>> = {
  hero: HeroForm,
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
  gallery: GalleryForm,
  products: (p) => <ItemListForm {...p} heading="Products" />,
  services: (p) => <ItemListForm {...p} heading="Services" />,
  listings: (p) => <ItemListForm {...p} heading="Listings" />,
  menu: (p) => <ItemListForm {...p} heading="Menu items" />,
};

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero", featured: "Featured", bio: "Bio", links: "Links", social: "Socials", cta: "CTA",
  video: "Video", gallery: "Gallery", text: "Text", products: "Products",
  services: "Services", testimonials: "Testimonials", contact: "Contact",
  faq: "FAQ", menu: "Menu", schedule: "Schedule", about: "About",
  offer: "Offer", plans: "Plans", join: "Join", listings: "Listings",
};

// ─── Main component ───

export function BuilderSectionEditor({
  section, onClose, onSave, onToggleVisibility, onDelete, isSaving, surfaceType, surfaceId,
}: BuilderSectionEditorProps) {
  const [localSchema, setLocalSchema] = useState<Record<string, unknown>>(section.schema);
  const [dirty, setDirty] = useState(false);
  const [aiFillOpen, setAiFillOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleAiGenerated = async (schema: Record<string, unknown>) => {
    console.log("[AI_FILL] AI_FILL_RESULT schema:", JSON.stringify(schema).slice(0, 500));
    console.log("[AI_FILL] UPSERT_SECTION_PAYLOAD", { sectionId: section.id, sectionType: section.section_type, schemaKeys: Object.keys(schema) });
    setLocalSchema(schema);
    setDirty(false); // Mark not dirty so server sync takes effect
    // Save immediately
    await onSave(section.id, schema);
    console.log("[AI_FILL] UPSERT_SECTION_DONE", { sectionId: section.id });
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

      {/* AI Fill button */}
      <div className="px-4 py-3 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => setAiFillOpen(true)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Fill this section
        </Button>
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

      {/* Save + Delete buttons */}
      <div className="p-4 border-t border-border space-y-2">
        {FormComponent && (
          <Button
            className="w-full gap-2"
            disabled={!dirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          disabled={isDeleting}
          onClick={async () => {
            if (!confirm(`Delete "${label}" section? This cannot be undone.`)) return;
            setIsDeleting(true);
            const ok = await onDelete(section.id);
            if (ok) onClose();
            setIsDeleting(false);
          }}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete section
        </Button>
      </div>

      {/* AI Fill modal */}
      <BuilderAiFillModal
        open={aiFillOpen}
        onOpenChange={setAiFillOpen}
        sectionType={section.section_type}
        surfaceType={surfaceType}
        onGenerated={handleAiGenerated}
      />
    </aside>
  );
}
