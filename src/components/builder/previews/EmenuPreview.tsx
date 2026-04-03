/**
 * EmenuPreview — Visual food menu preview component
 * Replaces the old text-only MenuPreview for emenu surfaces.
 * Renders food cards with images, badges, dietary tags, pricing.
 */

import { useState } from "react";
import { DIETARY_TAGS, ITEM_BADGES, FOOD_CATEGORY_PLACEHOLDERS } from "@/lib/builder/emenu/types";
import type { EmenuCategory, EmenuItem } from "@/lib/builder/emenu/types";

interface EmenuPreviewProps {
  schema: Record<string, unknown>;
  canvas?: {
    sectionId: string;
    onUpdateField?: (sectionId: string, fieldPath: string, value: unknown) => void;
    onImageReplace?: (sectionId: string, fieldPath: string, url: string, source: string) => void;
  };
}

function getPlaceholderEmoji(categoryName: string): string {
  const normalized = categoryName.toLowerCase().replace(/[\s/&]+/g, "_");
  if (FOOD_CATEGORY_PLACEHOLDERS[normalized]) return FOOD_CATEGORY_PLACEHOLDERS[normalized];
  for (const [key, emoji] of Object.entries(FOOD_CATEGORY_PLACEHOLDERS)) {
    if (normalized.includes(key) || key.includes(normalized)) return emoji;
  }
  return "🍽️";
}

function BadgePill({ badgeKey }: { badgeKey: string }) {
  const badge = ITEM_BADGES.find((b) => b.key === badgeKey);
  if (!badge) return null;
  const colorMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-800",
    violet: "bg-violet-100 text-violet-800",
    rose: "bg-rose-100 text-rose-800",
    orange: "bg-orange-100 text-orange-800",
    teal: "bg-teal-100 text-teal-800",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorMap[badge.color] || "bg-muted text-muted-foreground"}`}>
      {badge.label}
    </span>
  );
}

function DietaryIcon({ tagKey }: { tagKey: string }) {
  const tag = DIETARY_TAGS.find((t) => t.key === tagKey);
  if (!tag) return null;
  return (
    <span className="text-xs" title={tag.label}>{tag.icon}</span>
  );
}

function FoodItemCard({
  item,
  currency,
  showImages,
  showBadges,
  showDietary,
  layout,
}: {
  item: EmenuItem;
  currency: string;
  showImages: boolean;
  showBadges: boolean;
  showDietary: boolean;
  layout: "grid" | "list";
}) {
  const hasSale = item.sale_price && item.sale_price !== item.price;
  const available = item.is_available !== false;

  if (layout === "list") {
    return (
      <div className={`flex gap-3 p-3 rounded-lg border border-border/50 bg-card transition-shadow hover:shadow-sm ${!available ? "opacity-50" : ""}`}>
        {showImages && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-2xl">🍽️</span>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-semibold text-foreground truncate">{item.name || "Menu Item"}</h4>
                {showBadges && item.badges?.map((b) => <BadgePill key={b} badgeKey={b} />)}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
              )}
              {showDietary && item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {item.dietary_tags.map((t) => <DietaryIcon key={t} tagKey={t} />)}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {hasSale ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground line-through">{currency} {item.price}</span>
                  <span className="text-sm font-bold text-rose-600">{currency} {item.sale_price}</span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-foreground">{currency} {item.price}</span>
              )}
            </div>
          </div>
          {item.portion_sizes && item.portion_sizes.length > 0 && (
            <div className="flex gap-1.5 mt-1.5">
              {item.portion_sizes.map((ps, i) => (
                <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {ps.label}: {currency} {ps.price}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className={`rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:shadow-md ${!available ? "opacity-50" : ""}`}>
      {showImages && (
        <div className="aspect-square bg-muted relative overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          {showBadges && item.badges && item.badges.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
              {item.badges.map((b) => <BadgePill key={b} badgeKey={b} />)}
            </div>
          )}
          {!available && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
            </div>
          )}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">{item.name || "Menu Item"}</h4>
          {showDietary && item.dietary_tags && item.dietary_tags.length > 0 && (
            <div className="flex gap-0.5 flex-shrink-0">
              {item.dietary_tags.slice(0, 3).map((t) => <DietaryIcon key={t} tagKey={t} />)}
            </div>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {hasSale ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground line-through">{currency} {item.price}</span>
              <span className="text-sm font-bold text-rose-600">{currency} {item.sale_price}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-foreground">{currency} {item.price}</span>
          )}
        </div>
        {item.portion_sizes && item.portion_sizes.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {item.portion_sizes.map((ps, i) => (
              <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {ps.label}: {ps.price}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryFilterBar({
  categories,
  activeIndex,
  onSelect,
}: {
  categories: EmenuCategory[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
      <button
        onClick={() => onSelect(-1)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
          activeIndex === -1
            ? "bg-foreground text-background"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {categories.map((cat, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeIndex === i
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {getPlaceholderEmoji(cat.name || "")} {cat.name || "Category"}
        </button>
      ))}
    </div>
  );
}

export function EmenuPreview({ schema }: EmenuPreviewProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);

  const rawCategories = (schema.categories as EmenuCategory[]) || [];
  const categories = rawCategories.filter((c) => !c._hidden);
  const layoutStyle = (schema.layout_style as "grid" | "list") || "grid";
  const currency = (schema.currency_symbol as string) || (schema.currency as string) || "UGX";
  const showImages = schema.show_images !== false;
  const showBadges = schema.show_badges !== false;
  const showDietary = schema.show_dietary !== false;
  const colsDesktop = (schema.columns_desktop as number) || 2;

  const displayCategories = activeCategoryIndex === -1
    ? categories
    : [categories[activeCategoryIndex]].filter(Boolean);

  const gridCols = colsDesktop === 3 ? "grid-cols-3" : colsDesktop === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <div className="py-4 px-4 sm:px-6">
      <h3 className="text-lg font-bold text-foreground mb-1">
        {(schema.heading as string) || "Our Menu"}
      </h3>
      {schema.description && (
        <p className="text-sm text-muted-foreground mb-3">{schema.description as string}</p>
      )}

      {categories.length > 1 && (
        <div className="mb-4">
          <CategoryFilterBar
            categories={categories}
            activeIndex={activeCategoryIndex}
            onSelect={setActiveCategoryIndex}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
          <span className="text-4xl">🍽️</span>
          <p className="text-sm text-muted-foreground mt-2">No menu items added yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add categories and items from the editor panel</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayCategories.map((cat, catIdx) => (
            <div key={catIdx}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-lg">{getPlaceholderEmoji(cat.name || "")}</span>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {cat.name || "Category"}
                  </h4>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  )}
                </div>
                {cat.items && (
                  <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-full">
                    {cat.items.length} items
                  </span>
                )}
              </div>

              {/* Items */}
              {layoutStyle === "grid" ? (
                <div className={`grid ${gridCols} gap-3`}>
                  {(cat.items || []).map((item, itemIdx) => (
                    <FoodItemCard
                      key={itemIdx}
                      item={item}
                      currency={currency}
                      showImages={showImages}
                      showBadges={showBadges}
                      showDietary={showDietary}
                      layout="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(cat.items || []).map((item, itemIdx) => (
                    <FoodItemCard
                      key={itemIdx}
                      item={item}
                      currency={currency}
                      showImages={showImages}
                      showBadges={showBadges}
                      showDietary={showDietary}
                      layout="list"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
