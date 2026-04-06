import { useState } from "react";
import {
  ChevronRight, Image, Type, Palette, LayoutGrid, List,
  Plus, Trash2, GripVertical, Clock, MapPin, Phone,
  Globe, Star, Truck, ShoppingCart, Tag, Search,
  ChefHat, UtensilsCrossed, Leaf, Flame, Settings2,
  Eye, EyeOff, ArrowUpDown, Hash, DollarSign, Percent,
  MessageSquare, Instagram, Facebook, Mail, Download
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface EmenuEditorPanelProps {
  category: string | null;
  businessName: string;
  selectedSection: string | null;
  onAction: (action: string, payload?: any) => void;
}

// ─── Accordion Section ─────────────────────────────────────────

function EditorSection({
  label,
  icon: Icon,
  defaultOpen,
  children,
}: {
  label: string;
  icon: any;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1 text-left">
          {label}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

// ─── Reusable Controls ──────────────────────────────────────────

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function ToggleControl({ label, defaultChecked, onChange }: { label: string; defaultChecked?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <ControlRow label={label}>
      <Switch defaultChecked={defaultChecked} onCheckedChange={onChange} />
    </ControlRow>
  );
}

function SelectControl({ label, options, defaultValue, onChange }: { label: string; options: string[]; defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <ControlRow label={label}>
      <select
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className="text-[11px] bg-muted border border-border rounded-md px-2 py-1 text-foreground"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </ControlRow>
  );
}

function NumberControl({ label, defaultValue, min, max, onChange }: { label: string; defaultValue?: number; min?: number; max?: number; onChange?: (v: number) => void }) {
  return (
    <ControlRow label={label}>
      <input
        type="number"
        defaultValue={defaultValue}
        min={min}
        max={max}
        onChange={(e) => onChange?.(parseInt(e.target.value))}
        className="w-16 text-[11px] bg-muted border border-border rounded-md px-2 py-1 text-foreground text-right"
      />
    </ControlRow>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant }: { icon: any; label: string; onClick?: () => void; variant?: "default" | "destructive" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function EmenuEditorPanel({
  category,
  businessName,
  selectedSection,
  onAction,
}: EmenuEditorPanelProps) {
  const isEmenu = category === "emenu";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">
          {isEmenu ? "Menu Editor" : "Page Editor"}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {businessName || "Your Website"}
        </p>
      </div>

      {/* Editor sections */}
      <div className="flex-1 overflow-y-auto">

        {/* 1. IMAGE MANAGEMENT */}
        <EditorSection label="Images" icon={Image} defaultOpen>
          <ActionButton icon={Image} label="Replace Selected Image" onClick={() => onAction("replace_image")} />
          <ActionButton icon={Download} label="Upload New Image" onClick={() => onAction("upload_image")} />
          <ToggleControl label="Lazy Loading" defaultChecked />
          <ToggleControl label="Hover Zoom" />
          <SelectControl label="Image Fit" options={["cover", "contain", "fill"]} defaultValue="cover" />
        </EditorSection>

        {/* 2. TYPOGRAPHY & STYLING */}
        <EditorSection label="Typography & Style" icon={Type}>
          <SelectControl label="Font Family" options={["Inter", "Poppins", "Playfair Display", "DM Sans", "Montserrat", "Lora"]} defaultValue="Inter" onChange={(v) => onAction("set_font", v)} />
          <SelectControl label="Heading Size" options={["Small", "Medium", "Large", "XL"]} defaultValue="Large" />
          <SelectControl label="Font Weight" options={["Normal", "Medium", "Semibold", "Bold"]} defaultValue="Bold" />
          <NumberControl label="Line Height" defaultValue={1.5} min={1} max={3} />
          <Separator className="my-1" />
          <ActionButton icon={Palette} label="Primary Color" onClick={() => onAction("change_colors")} />
          <ActionButton icon={Palette} label="Price Color" onClick={() => onAction("change_price_color")} />
          <ActionButton icon={Palette} label="CTA Button Color" onClick={() => onAction("change_cta_color")} />
        </EditorSection>

        {/* 3. LAYOUT */}
        <EditorSection label="Layout" icon={LayoutGrid}>
          <SelectControl label="Display Mode" options={["Grid", "List"]} defaultValue="Grid" onChange={(v) => onAction("set_display_mode", v)} />
          <NumberControl label="Columns (Desktop)" defaultValue={3} min={1} max={4} onChange={(v) => onAction("set_columns_desktop", v)} />
          <NumberControl label="Columns (Mobile)" defaultValue={2} min={1} max={2} onChange={(v) => onAction("set_columns_mobile", v)} />
          <SelectControl label="Card Spacing" options={["Compact", "Comfortable", "Spacious"]} defaultValue="Comfortable" />
          <NumberControl label="Border Radius" defaultValue={12} min={0} max={24} />
          <ToggleControl label="Sticky Cart Sidebar" />
          <SelectControl label="Mobile Stack" options={["Cards", "List", "Compact"]} defaultValue="Cards" />
        </EditorSection>

        {/* 4. FOOD / MENU DATA (emenu only) */}
        {isEmenu && (
          <EditorSection label="Menu Items" icon={UtensilsCrossed}>
            <p className="text-[11px] text-muted-foreground">Click items in the preview to edit inline. Use controls below for bulk settings.</p>
            <ActionButton icon={Plus} label="Add Menu Item" onClick={() => onAction("add_menu_item")} />
            <Separator className="my-1" />
            <ToggleControl label="Show Images" defaultChecked />
            <ToggleControl label="Show Prices" defaultChecked />
            <ToggleControl label="Show Descriptions" defaultChecked />
            <ToggleControl label="Show Dietary Icons" defaultChecked />
            <ToggleControl label="Show Badges" defaultChecked />
            <ToggleControl label="Enable Portion Sizes" />
            <ToggleControl label="Enable Add-ons / Modifiers" />
          </EditorSection>
        )}

        {/* 5. CATEGORIES & FILTERING (emenu only) */}
        {isEmenu && (
          <EditorSection label="Categories" icon={Hash}>
            <ActionButton icon={Plus} label="Add Category" onClick={() => onAction("add_category")} />
            <ActionButton icon={ArrowUpDown} label="Reorder Categories" onClick={() => onAction("reorder_categories")} />
            <Separator className="my-1" />
            <ToggleControl label="Show Category Images" />
            <ToggleControl label="Show Item Count" defaultChecked />
            <SelectControl label="Filter UI Style" options={["Tabs", "Dropdown", "Sidebar", "Chips"]} defaultValue="Tabs" />
          </EditorSection>
        )}

        {/* 6. PRICING & ORDER (emenu only) */}
        {isEmenu && (
          <EditorSection label="Pricing & Orders" icon={DollarSign}>
            <ToggleControl label="Show Tax" />
            <ToggleControl label="Show Delivery Charge" />
            <NumberControl label="Min Order Value" defaultValue={0} min={0} />
            <ToggleControl label="Discount Rules" />
            <ToggleControl label="Promo Code Toggle" />
            <ToggleControl label="Price per Variant" />
          </EditorSection>
        )}

        {/* 7. DELIVERY & PICKUP (emenu only) */}
        {isEmenu && (
          <EditorSection label="Delivery & Pickup" icon={Truck}>
            <SelectControl label="Order Type" options={["Delivery Only", "Pickup Only", "Both"]} defaultValue="Both" />
            <NumberControl label="Estimated Time (min)" defaultValue={30} min={5} max={120} />
            <NumberControl label="Delivery Radius (km)" defaultValue={10} min={1} max={50} />
            <ToggleControl label="Pickup Time Slots" />
            <SelectControl label="Switcher Style" options={["Tabs", "Toggle", "Buttons"]} defaultValue="Tabs" />
          </EditorSection>
        )}

        {/* 8. CART & CHECKOUT (emenu only) */}
        {isEmenu && (
          <EditorSection label="Cart & Checkout" icon={ShoppingCart}>
            <ToggleControl label="Add to Cart Button" defaultChecked />
            <ToggleControl label="Quantity Selector" defaultChecked />
            <ToggleControl label="Cart Badge" defaultChecked />
            <ToggleControl label="Mini Cart" defaultChecked />
            <ToggleControl label="Order Notes" />
          </EditorSection>
        )}

        {/* 9. BUSINESS INFO */}
        <EditorSection label="Business Info" icon={MapPin}>
          <ActionButton icon={Type} label="Edit Business Name" onClick={() => onAction("edit_business_name")} />
          <ActionButton icon={Image} label="Change Logo" onClick={() => onAction("change_logo")} />
          <ActionButton icon={Image} label="Change Cover/Banner" onClick={() => onAction("change_banner")} />
          <Separator className="my-1" />
          <ActionButton icon={Clock} label="Opening Hours" onClick={() => onAction("edit_hours")} />
          <ActionButton icon={Phone} label="Phone / WhatsApp" onClick={() => onAction("edit_phone")} />
          <ActionButton icon={MapPin} label="Address & Map" onClick={() => onAction("edit_address")} />
          <ActionButton icon={Instagram} label="Social Links" onClick={() => onAction("edit_social")} />
          <ActionButton icon={Star} label="Rating Display" onClick={() => onAction("edit_rating")} />
        </EditorSection>

        {/* 10. UX / CONVERSION */}
        <EditorSection label="UX & Conversion" icon={Search}>
          <ToggleControl label="Search Bar" />
          <ToggleControl label="Sort Options" />
          <ToggleControl label="Recently Viewed" />
          <ToggleControl label="Order Again" />
          <ToggleControl label="Favorites" />
          <ToggleControl label="Free Delivery Progress" />
          <ToggleControl label="Est. Delivery Time" />
        </EditorSection>

        {/* BUILDER CONTROLS */}
        <EditorSection label="Builder Controls" icon={Settings2}>
          <ActionButton icon={Plus} label="Add Section" onClick={() => onAction("add_section")} />
          <ActionButton icon={ArrowUpDown} label="Reorder Sections" onClick={() => onAction("reorder_sections")} />
          <ActionButton icon={Eye} label="Responsive Preview" onClick={() => onAction("responsive_preview")} />
          <Separator className="my-1" />
          <ActionButton icon={Tag} label="Out of Stock Mode" onClick={() => onAction("out_of_stock")} />
          <ActionButton icon={Globe} label="Multi-language" onClick={() => onAction("multi_language")} />
          <ActionButton icon={Leaf} label="Allergen Management" onClick={() => onAction("allergen_management")} />
        </EditorSection>

      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-border shrink-0">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Changes apply to your draft. Click <strong>Publish</strong> to go live.
        </p>
      </div>
    </div>
  );
}
