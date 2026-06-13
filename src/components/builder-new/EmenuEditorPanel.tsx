import { useState } from "react";
import {
  ChevronRight, LayoutGrid, List, Image, Plus, Trash2,
  GripVertical, Type, Phone, MapPin, Store, Clock,
  Share2, Truck, Package, Grid3X3, Percent, ClipboardList, Building
} from "lucide-react";
import {
  ALL_CATEGORY_KEYS,
  getCategory,
  isBuilderCategory,
  type BuilderCategory,
} from "@/lib/builder/categoryRegistry";

interface EmenuEditorPanelProps {
  businessName: string;
  category: string | null;
  onAction: (action: string, payload?: any) => void;
}

type Section = "menu" | "categories" | "images" | "layout" | "business" | "hours" | "social" | "commerce";

const PANEL_CONFIG: Record<string, {
  title: string;
  fallbackName: string;
  badge: string;
  primaryLabel: string;
  primaryHint: string;
  primaryAddLabel: string;
  primaryAddAction: string;
  categoryLabel: string;
  categoryHint: string;
  categoryAddLabel: string;
  categoryDeleteLabel: string;
  businessNameLabel: string;
  hoursHint: string;
  commerceHint: string;
  commerceLabel: string;
  sections: { id: Section; label: string; icon: React.ElementType }[];
}> = {
  emenu: {
    title: "Menu Editor",
    fallbackName: "Your Menu",
    badge: "eMenu",
    primaryLabel: "Menu Items",
    primaryHint: "Click any item in preview to edit name, price, or description directly.",
    primaryAddLabel: "Add Menu Item",
    primaryAddAction: "add_menu_item",
    categoryLabel: "Categories",
    categoryHint: "Manage menu categories. Click categories in preview to rename.",
    categoryAddLabel: "Add Category",
    categoryDeleteLabel: "Delete Selected Category",
    businessNameLabel: "Restaurant Name",
    hoursHint: "Set your restaurant's opening hours.",
    commerceHint: "Configure ordering, delivery, and payments.",
    commerceLabel: "Commerce & Orders",
    sections: [
      { id: "menu", label: "Menu Items", icon: Type },
      { id: "categories", label: "Categories", icon: GripVertical },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Business Info", icon: Store },
      { id: "hours", label: "Hours", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Commerce & Orders", icon: Truck },
    ],
  },
  eshop: {
    title: "Shop Editor",
    fallbackName: "Your Shop",
    badge: "Eshop",
    primaryLabel: "Products",
    primaryHint: "Click any product in preview to edit name, price, description, or button.",
    primaryAddLabel: "Add Product",
    primaryAddAction: "add_product",
    categoryLabel: "Collections",
    categoryHint: "Manage product collections and storefront groups.",
    categoryAddLabel: "Add Collection",
    categoryDeleteLabel: "Delete Selected Collection",
    businessNameLabel: "Shop Name",
    hoursHint: "Set pickup, support, or store operating hours.",
    commerceHint: "Configure cart, checkout, delivery, and payments.",
    commerceLabel: "Cart & Checkout",
    sections: [
      { id: "menu", label: "Products", icon: Package },
      { id: "categories", label: "Collections", icon: Grid3X3 },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Business Info", icon: Store },
      { id: "hours", label: "Hours", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Cart & Checkout", icon: Percent },
    ],
  },
  estore: {
    title: "Store Editor",
    fallbackName: "Your Store",
    badge: "Estore",
    primaryLabel: "Catalog Items",
    primaryHint: "Click any catalog item in preview to edit product details or quote CTA.",
    primaryAddLabel: "Add Catalog Item",
    primaryAddAction: "add_product",
    categoryLabel: "Catalog Groups",
    categoryHint: "Manage wholesale categories, supplier groups, and listing filters.",
    categoryAddLabel: "Add Catalog Group",
    categoryDeleteLabel: "Delete Selected Group",
    businessNameLabel: "Store / Company Name",
    hoursHint: "Set warehouse, pickup, or business operating hours.",
    commerceHint: "Configure quote requests, bulk pricing, and payment preferences.",
    commerceLabel: "Quotes & Bulk Pricing",
    sections: [
      { id: "menu", label: "Catalog Items", icon: ClipboardList },
      { id: "categories", label: "Catalog Groups", icon: Grid3X3 },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Supplier Info", icon: Building },
      { id: "hours", label: "Hours", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Quotes & Bulk Pricing", icon: Truck },
    ],
  },
  esite: {
    title: "Site Editor",
    fallbackName: "Your Site",
    badge: "Esite",
    primaryLabel: "Services",
    primaryHint: "Click service blocks in preview to edit names, descriptions, and calls to action.",
    primaryAddLabel: "Add Service",
    primaryAddAction: "add_service",
    categoryLabel: "Sections",
    categoryHint: "Manage service sections and page groups.",
    categoryAddLabel: "Add Section Group",
    categoryDeleteLabel: "Delete Selected Group",
    businessNameLabel: "Business Name",
    hoursHint: "Set office, booking, or support hours.",
    commerceHint: "Configure inquiries, bookings, and payments.",
    commerceLabel: "Inquiries & Payments",
    sections: [
      { id: "menu", label: "Services", icon: ClipboardList },
      { id: "categories", label: "Sections", icon: LayoutGrid },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Business Info", icon: Building },
      { id: "hours", label: "Hours", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Inquiries & Payments", icon: Phone },
    ],
  },
  influencer: {
    title: "Creator Editor",
    fallbackName: "Your Bio",
    badge: "Influencer",
    primaryLabel: "Links & Content",
    primaryHint: "Click links, content cards, or affiliate blocks in preview to edit them.",
    primaryAddLabel: "Add Link",
    primaryAddAction: "add_link_card",
    categoryLabel: "Content Groups",
    categoryHint: "Manage link groups, sponsor blocks, and content sections.",
    categoryAddLabel: "Add Content Group",
    categoryDeleteLabel: "Delete Selected Group",
    businessNameLabel: "Creator Name",
    hoursHint: "Set availability or booking hours.",
    commerceHint: "Configure affiliate links, sponsorships, and payments.",
    commerceLabel: "Affiliate & Payments",
    sections: [
      { id: "menu", label: "Links & Content", icon: Share2 },
      { id: "categories", label: "Content Groups", icon: Grid3X3 },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Profile Info", icon: Store },
      { id: "hours", label: "Availability", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Affiliate & Payments", icon: Percent },
    ],
  },
  community: {
    title: "Community Editor",
    fallbackName: "Your Community",
    badge: "Community",
    primaryLabel: "Community Content",
    primaryHint: "Click events, courses, membership blocks, or group content in preview to edit them.",
    primaryAddLabel: "Add Community Block",
    primaryAddAction: "add_event",
    categoryLabel: "Groups",
    categoryHint: "Manage events, courses, groups, and membership sections.",
    categoryAddLabel: "Add Group",
    categoryDeleteLabel: "Delete Selected Group",
    businessNameLabel: "Community Name",
    hoursHint: "Set event, class, or support hours.",
    commerceHint: "Configure memberships, tickets, and payments.",
    commerceLabel: "Memberships & Payments",
    sections: [
      { id: "menu", label: "Community Content", icon: ClipboardList },
      { id: "categories", label: "Groups", icon: Grid3X3 },
      { id: "images", label: "Images", icon: Image },
      { id: "layout", label: "Layout", icon: LayoutGrid },
      { id: "business", label: "Community Info", icon: Building },
      { id: "hours", label: "Hours", icon: Clock },
      { id: "social", label: "Social Links", icon: Share2 },
      { id: "commerce", label: "Memberships & Payments", icon: Truck },
    ],
  },
};

export function EmenuEditorPanel({ businessName, category, onAction }: EmenuEditorPanelProps) {
  const [expanded, setExpanded] = useState<Section | null>("menu");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [columns, setColumns] = useState<2 | 3>(2);
  const normalizedCategory = CATEGORY_ALIASES[category || ""] || category || "eshop";
  const config = PANEL_CONFIG[normalizedCategory] || PANEL_CONFIG.eshop;

  const toggle = (s: Section) => setExpanded(expanded === s ? null : s);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">{config.title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {businessName || config.fallbackName} • {config.badge}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {config.sections.map((sec) => (
          <div key={sec.id} className="border-b border-border">
            <button
              onClick={() => toggle(sec.id)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <sec.icon className="h-3.5 w-3.5" />
                {sec.label}
              </span>
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded === sec.id ? "rotate-90" : ""}`} />
            </button>

            {expanded === sec.id && (
              <div className="px-4 pb-3 space-y-2">
                {sec.id === "menu" && (
                  <>
                    <p className="text-[11px] text-muted-foreground">{config.primaryHint}</p>
                    <button
                      onClick={() => onAction(config.primaryAddAction)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> {config.primaryAddLabel}
                    </button>
                  </>
                )}

                {sec.id === "categories" && (
                  <>
                    <p className="text-[11px] text-muted-foreground">{config.categoryHint}</p>
                    <button
                      onClick={() => onAction("add_category")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> {config.categoryAddLabel}
                    </button>
                    <button
                      onClick={() => onAction("delete_category")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {config.categoryDeleteLabel}
                    </button>
                  </>
                )}

                {sec.id === "images" && (
                  <>
                    <button
                      onClick={() => onAction("upload_image")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" /> Upload Image
                    </button>
                    <button
                      onClick={() => onAction("stock_image")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" /> Stock Image (Pexels)
                    </button>
                    <button
                      onClick={() => onAction("ai_generate_image")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" /> AI Generate
                    </button>
                    <p className="text-[11px] text-muted-foreground">Click any image in preview to replace it.</p>
                  </>
                )}

                {sec.id === "layout" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Display Mode</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setLayoutMode("grid"); onAction("set_layout", { mode: "grid" }); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${layoutMode === "grid" ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                        >
                          <LayoutGrid className="h-3 w-3" /> Grid
                        </button>
                        <button
                          onClick={() => { setLayoutMode("list"); onAction("set_layout", { mode: "list" }); }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${layoutMode === "list" ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                        >
                          <List className="h-3 w-3" /> List
                        </button>
                      </div>
                    </div>
                    {layoutMode === "grid" && (
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Columns</label>
                        <div className="flex gap-1">
                          {([2, 3] as const).map((n) => (
                            <button
                              key={n}
                              onClick={() => { setColumns(n); onAction("set_columns", { columns: n }); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${columns === n ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}
                            >
                              {n} cols
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sec.id === "business" && (
                  <div className="space-y-2">
                    {[
                      { icon: Store, label: config.businessNameLabel, action: "edit_business_name" },
                      { icon: Image, label: "Logo", action: "edit_logo" },
                      { icon: Phone, label: "Phone", action: "edit_phone" },
                      { icon: MapPin, label: "Address", action: "edit_address" },
                    ].map((item) => (
                      <button
                        key={item.action}
                        onClick={() => onAction(item.action)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {sec.id === "hours" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">{config.hoursHint}</p>
                    <button
                      onClick={() => onAction("hours")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Edit Opening Hours
                    </button>
                  </div>
                )}

                {sec.id === "social" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Add your social media links.</p>
                    <button
                      onClick={() => onAction("social")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Set Social Links
                    </button>
                  </div>
                )}

                {sec.id === "commerce" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">{config.commerceHint}</p>
                    <button
                      onClick={() => onAction("commerce_config")}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {config.commerceLabel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-muted-foreground">
          Click elements in preview to edit directly.
        </p>
      </div>
    </div>
  );
}
