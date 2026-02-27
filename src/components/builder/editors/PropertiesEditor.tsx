import { useState } from "react";
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
import { X, Plus, Trash2, Home, DollarSign, MapPin, Star } from "lucide-react";
import { MediaPickerList } from "../media/MediaPickerList";
import type { MediaAsset } from "../media/MediaPicker";
import { BuilderMediaPicker, type MediaValue } from "../BuilderMediaPicker";

interface Property {
  title: string;
  type: "sale" | "rent";
  price: string;
  currency: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  size_sqft: string;
  description: string;
  photos: MediaValue[];
  media: MediaAsset[];
  amenities: string[];
  status: "active" | "draft";
}

interface PropertiesFormProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
  surfaceId?: string;
}

const EMPTY_PROPERTY: Property = {
  title: "",
  type: "sale",
  price: "",
  currency: "USD",
  location: "",
  bedrooms: "",
  bathrooms: "",
  size_sqft: "",
  description: "",
  photos: [],
  media: [],
  amenities: [],
  status: "active",
};

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "UGX", "TZS", "NGN", "ZAR", "AED"];

export function PropertiesEditor({ schema, update, surfaceId }: PropertiesFormProps) {
  const items = ((schema.items as any[]) || []).map((p: any) => {
    // Migrate legacy photos[] to media[]
    const legacyPhotos: MediaValue[] = p.photos || [];
    const existingMedia: MediaAsset[] = p.media || [];
    const media: MediaAsset[] = existingMedia.length > 0
      ? existingMedia
      : legacyPhotos.filter((ph: any) => ph?.url).map((ph: any) => ({ type: "image" as const, src: ph.url, provider: "url" as const }));
    return { ...EMPTY_PROPERTY, ...p, media } as Property;
  });
  const [showDialog, setShowDialog] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Property>({ ...EMPTY_PROPERTY });
  const [amenityInput, setAmenityInput] = useState("");

  // Stats
  const totalProperties = items.length;
  const activeListings = items.filter((p) => p.status === "active").length;
  const totalValue = items.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

  const openCreate = () => {
    setEditIndex(null);
    setForm({ ...EMPTY_PROPERTY });
    setAmenityInput("");
    setShowDialog(true);
  };

  const openEdit = (i: number) => {
    setEditIndex(i);
    setForm({ ...EMPTY_PROPERTY, ...items[i] });
    setAmenityInput("");
    setShowDialog(true);
  };

  const saveProperty = () => {
    const updated = [...items];
    if (editIndex !== null) {
      updated[editIndex] = { ...form };
    } else {
      updated.push({ ...form });
    }
    update({ items: updated });
    setShowDialog(false);
  };

  const deleteProperty = (i: number) => {
    if (!confirm(`Delete "${items[i].title}"?`)) return;
    update({ items: items.filter((_, j) => j !== i) });
  };

  const addAmenity = () => {
    const tag = amenityInput.trim();
    if (tag && !form.amenities.includes(tag)) {
      setForm({ ...form, amenities: [...form.amenities, tag] });
    }
    setAmenityInput("");
  };

  const removeAmenity = (tag: string) => {
    setForm({ ...form, amenities: form.amenities.filter((a) => a !== tag) });
  };

  return (
    <>
      {/* Heading */}
      <div className="space-y-1.5">
        <Label className="text-xs">Section Heading</Label>
        <Input
          value={(schema.heading as string) || ""}
          onChange={(e) => update({ heading: e.target.value })}
          className="text-sm"
          placeholder="Properties"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{totalProperties}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{activeListings}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-xs font-bold truncate">{totalValue > 0 ? totalValue.toLocaleString() : "—"}</p>
          <p className="text-[10px] text-muted-foreground">Value</p>
        </div>
      </div>

      {/* Property cards */}
      {items.map((prop, i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => openEdit(i)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{prop.title || "Untitled"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${prop.type === "sale" ? "bg-primary/10 text-primary" : "bg-accent/50 text-accent-foreground"}`}>
                  {prop.type === "sale" ? "For Sale" : "For Rent"}
                </span>
                {prop.location && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {prop.location}
                  </span>
                )}
              </div>
              {prop.price && (
                <p className="text-xs font-medium text-primary mt-1">{prop.currency} {parseFloat(prop.price).toLocaleString()}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteProperty(i); }}>
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
            {prop.bedrooms && <span>{prop.bedrooms} bed</span>}
            {prop.bathrooms && <span>{prop.bathrooms} bath</span>}
            {prop.size_sqft && <span>{prop.size_sqft} sqft</span>}
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={openCreate}>
        <Plus className="h-3.5 w-3.5" /> Add Property
      </Button>

      {/* ═══ Property Dialog ═══ */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editIndex !== null ? "Edit Property" : "Add Property"}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Modern 3BR Apartment" autoFocus />
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Listing Type</Label>
              <div className="flex gap-2">
                <Button variant={form.type === "sale" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, type: "sale" })}>
                  <DollarSign className="h-3.5 w-3.5 mr-1" /> For Sale
                </Button>
                <Button variant={form.type === "rent" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, type: "rent" })}>
                  <Home className="h-3.5 w-3.5 mr-1" /> For Rent
                </Button>
              </div>
            </div>

            {/* Price + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Price *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="250000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kampala, Uganda" />
            </div>

            {/* Bedrooms, Bathrooms, Size */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Bedrooms</Label>
                <Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="3" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Bathrooms</Label>
                <Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} placeholder="2" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Size (sqft)</Label>
                <Input type="number" value={form.size_sqft} onChange={(e) => setForm({ ...form, size_sqft: e.target.value })} placeholder="1500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property..." rows={3} />
            </div>

            {/* Photos — MediaPickerList */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Property Photos (max 15)</Label>
              <p className="text-xs text-muted-foreground">First image is the cover photo</p>
              {form.media.length > 0 && form.media[0]?.src && (
                <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                  <Star className="h-3 w-3 fill-primary" /> Primary
                </div>
              )}
              <MediaPickerList
                items={form.media}
                onChange={(next) => {
                  if (next.length > 15) return;
                  setForm({ ...form, media: next });
                }}
                surfaceId={surfaceId || ""}
                label="Property Photos"
                max={15}
              />
            </div>

            {/* Amenities */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Amenities</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.amenities.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {tag}
                    <button onClick={() => removeAmenity(tag)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  placeholder="e.g., Pool, Parking..."
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); } }}
                />
                <Button variant="outline" size="sm" onClick={addAmenity}>Add</Button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Active Listing</Label>
              <Switch checked={form.status === "active"} onCheckedChange={(c) => setForm({ ...form, status: c ? "active" : "draft" })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={saveProperty} disabled={!form.title.trim() || !form.price.trim()}>
                Save Property
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
