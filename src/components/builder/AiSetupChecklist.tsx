/**
 * Post-AI Setup Checklist — Category-aware completion panel.
 * Shown after AI generates a draft so user knows what to review/complete.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuilderEngine } from "@/lib/builder/types";

interface ChecklistItem {
  key: string;
  label: string;
  /** Function to check if this item is complete based on surface data */
  check: (data: Record<string, unknown>) => boolean;
  /** Which editor module or section to navigate to */
  targetModule?: string;
}

// ─── Global checklist (all categories) ───

const GLOBAL_CHECKLIST: ChecklistItem[] = [
  { key: "logo", label: "Logo uploaded", check: (d) => !!d.logo_url, targetModule: "branding" },
  { key: "color", label: "Brand color set", check: (d) => !!d.primary_color, targetModule: "theme" },
  { key: "contact", label: "Contact info present", check: (d) => !!(d.contact_email || d.contact_phone), targetModule: "contact" },
  { key: "cta", label: "Primary CTA added", check: (d) => !!d.has_cta, targetModule: "hero" },
];

// ─── Category-specific checklists ───

const CATEGORY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  emenu: [
    { key: "categories", label: "Menu categories added", check: (d) => !!(d.menu_categories_count && Number(d.menu_categories_count) > 0), targetModule: "menu_categories" },
    { key: "items", label: "Menu items added", check: (d) => !!(d.menu_items_count && Number(d.menu_items_count) > 0), targetModule: "menu_items" },
    { key: "ordering", label: "Ordering settings configured", check: (d) => !!d.menu_type, targetModule: "order_settings" },
    { key: "payment", label: "Payment methods set", check: (d) => !!(d.pay_cash || d.pay_mobile_money || d.pay_card), targetModule: "order_settings" },
  ],
  eshop: [
    { key: "products", label: "Products added", check: (d) => !!(d.products_count && Number(d.products_count) > 0), targetModule: "products" },
    { key: "shipping", label: "Shipping model set", check: (d) => !!d.shipping_model, targetModule: "shipping" },
    { key: "collections", label: "Collections created", check: (d) => !!(d.collections_count && Number(d.collections_count) > 0), targetModule: "collections" },
  ],
  estore: [
    { key: "catalog", label: "Catalog populated", check: (d) => !!(d.products_count && Number(d.products_count) > 0), targetModule: "catalog" },
    { key: "bulk_pricing", label: "Bulk pricing configured", check: (d) => !!d.enable_bulk_pricing, targetModule: "bulk_pricing" },
    { key: "quotes", label: "Quote requests enabled", check: (d) => !!d.enable_quotes, targetModule: "quote_request" },
  ],
  esite: [
    { key: "services", label: "Services defined", check: (d) => !!(d.services_count && Number(d.services_count) > 0), targetModule: "services" },
    { key: "industry_module", label: "Industry features configured", check: (d) => !!d.industry_configured, targetModule: "hero" },
  ],
  influencer: [
    { key: "social_links", label: "Social links added", check: (d) => !!(d.social_links_count && Number(d.social_links_count) > 0), targetModule: "links" },
    { key: "bio", label: "Bio written", check: (d) => !!(d.bio && String(d.bio).length > 10), targetModule: "bio" },
    { key: "affiliate", label: "Featured products/pins set", check: (d) => !!(d.affiliate_count && Number(d.affiliate_count) > 0), targetModule: "affiliate" },
  ],
  community: [
    { key: "signup", label: "Signup mode configured", check: (d) => !!d.community_type, targetModule: "member_signup" },
    { key: "events", label: "First event created", check: (d) => !!(d.events_count && Number(d.events_count) > 0), targetModule: "events" },
    { key: "programs", label: "First program created", check: (d) => !!(d.programs_count && Number(d.programs_count) > 0), targetModule: "programs" },
  ],
};

interface Props {
  engine: BuilderEngine;
  surfaceData: Record<string, unknown>;
  onNavigateToModule?: (moduleKey: string) => void;
  onDismiss?: () => void;
}

export function AiSetupChecklist({ engine, surfaceData, onNavigateToModule, onDismiss }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const globalItems = GLOBAL_CHECKLIST;
  const categoryItems = CATEGORY_CHECKLISTS[engine.key] || [];
  const allItems = [...globalItems, ...categoryItems];

  const completedCount = allItems.filter((item) => item.check(surfaceData)).length;
  const totalCount = allItems.length;
  const allDone = completedCount === totalCount;

  if (allDone) return null; // Don't show if everything is complete

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Setup — {completedCount}/{totalCount} complete
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
          {onDismiss && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Items */}
        {!isCollapsed && (
          <div className="mt-3 space-y-1.5">
            {allItems.map((item) => {
              const done = item.check(surfaceData);
              return (
                <button
                  key={item.key}
                  onClick={() => !done && item.targetModule && onNavigateToModule?.(item.targetModule)}
                  className={cn(
                    "flex items-center gap-2 w-full text-left text-xs rounded px-2 py-1.5 transition-colors",
                    done
                      ? "text-muted-foreground"
                      : "text-foreground hover:bg-primary/10 cursor-pointer"
                  )}
                  disabled={done}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={cn(done && "line-through")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
