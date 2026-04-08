/**
 * EmenuPreview — Visual food menu preview component
 * Family-aware: renders differently for plateria/yumix/zooom templates.
 * Reads schema.categories (EmenuCategory[]) for items.
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
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${colorMap[badge.color] || "bg-muted text-muted-foreground"}`}>
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

// ─── Family-specific style tokens ───
type FamilyStyle = {
  bg: string;
  cardBg: string;
  cardBorder: string;
  headingClass: string;
  textClass: string;
  mutedClass: string;
  priceClass: string;
  badgeOverride?: boolean;
  pillBg: string;
  pillActive: string;
  pillText: string;
};

function getFamilyStyle(family: string | undefined): FamilyStyle | null {
  switch (family) {
    case "plateria":
      return {
        bg: "bg-[hsl(0,0%,5%)]",
        cardBg: "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,18%)]",
        cardBorder: "border-[hsl(0,0%,18%)]",
        headingClass: "text-[hsl(45,60%,80%)] font-serif",
        textClass: "text-[hsl(0,0%,90%)]",
        mutedClass: "text-[hsl(0,0%,60%)]",
        priceClass: "text-[hsl(35,70%,60%)]",
        pillBg: "bg-[hsl(0,0%,14%)]",
        pillActive: "bg-[hsl(35,70%,50%)] text-black",
        pillText: "text-[hsl(0,0%,70%)]",
      };
    case "yumix":
      return {
        bg: "bg-[hsl(30,10%,8%)]",
        cardBg: "bg-[hsl(30,8%,12%)] border-[hsl(30,8%,20%)]",
        cardBorder: "border-[hsl(30,8%,20%)]",
        headingClass: "text-white font-bold uppercase tracking-wide",
        textClass: "text-[hsl(0,0%,92%)]",
        mutedClass: "text-[hsl(0,0%,55%)]",
        priceClass: "text-[hsl(25,90%,55%)]",
        pillBg: "bg-[hsl(30,8%,15%)]",
        pillActive: "bg-[hsl(25,90%,50%)] text-black",
        pillText: "text-[hsl(0,0%,65%)]",
      };
    case "zooom":
      return {
        bg: "bg-white",
        cardBg: "bg-white border-[hsl(0,0%,90%)]",
        cardBorder: "border-[hsl(0,0%,90%)]",
        headingClass: "text-[hsl(0,0%,10%)] font-semibold",
        textClass: "text-[hsl(0,0%,15%)]",
        mutedClass: "text-[hsl(0,0%,50%)]",
        priceClass: "text-[hsl(145,60%,35%)]",
        pillBg: "bg-[hsl(0,0%,95%)]",
        pillActive: "bg-[hsl(145,60%,40%)] text-white",
        pillText: "text-[hsl(0,0%,40%)]",
      };
    default:
      return null;
  }
}

function FoodItemCard({
  item,
  currency,
  showImages,
  showBadges,
  showDietary,
  layout,
  familyStyle,
}: {
  item: EmenuItem;
  currency: string;
  showImages: boolean;
  showBadges: boolean;
  showDietary: boolean;
  layout: "grid" | "list";
  familyStyle?: FamilyStyle | null;
}) {
  const hasSale = item.sale_price && item.sale_price !== item.price;
  const available = item.is_available !== false;
  const fs = familyStyle;

  if (layout === "list") {
    return (
      <div className={`flex gap-3 p-3 rounded-lg border transition-shadow hover:shadow-sm ${!available ? "opacity-50" : ""} ${fs ? `${fs.cardBg}` : "border-border/50 bg-card"}`}>
        {showImages && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : null}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className={`text-sm font-semibold truncate ${fs ? fs.textClass : "text-foreground"}`}>{item.name || "Menu Item"}</h4>
                {showBadges && item.badges?.map((b) => <BadgePill key={b} badgeKey={b} />)}
              </div>
              {item.description && (
                <p className={`text-xs mt-0.5 line-clamp-2 ${fs ? fs.mutedClass : "text-muted-foreground"}`}>{item.description}</p>
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
                  <span className={`text-xs line-through ${fs ? fs.mutedClass : "text-muted-foreground"}`}>{currency} {item.price}</span>
                  <span className="text-sm font-bold text-rose-600">{currency} {item.sale_price}</span>
                </div>
              ) : (
                <span className={`text-sm font-semibold ${fs ? fs.priceClass : "text-foreground"}`}>{currency} {item.price}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className={`rounded-xl border overflow-hidden transition-all hover:shadow-md ${!available ? "opacity-50" : ""} ${fs ? `${fs.cardBg}` : "border-border/50 bg-card"}`}>
      {showImages && (
        <div className="aspect-square bg-muted relative overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : null}
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
          <h4 className={`text-sm font-semibold line-clamp-1 ${fs ? fs.textClass : "text-foreground"}`}>{item.name || "Menu Item"}</h4>
          {showDietary && item.dietary_tags && item.dietary_tags.length > 0 && (
            <div className="flex gap-0.5 flex-shrink-0">
              {item.dietary_tags.slice(0, 3).map((t) => <DietaryIcon key={t} tagKey={t} />)}
            </div>
          )}
        </div>
        {item.description && (
          <p className={`text-xs mt-0.5 line-clamp-2 ${fs ? fs.mutedClass : "text-muted-foreground"}`}>{item.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {hasSale ? (
            <div className="flex items-center gap-1.5">
              <span className={`text-xs line-through ${fs ? fs.mutedClass : "text-muted-foreground"}`}>{currency} {item.price}</span>
              <span className="text-sm font-bold text-rose-600">{currency} {item.sale_price}</span>
            </div>
          ) : (
            <span className={`text-sm font-semibold ${fs ? fs.priceClass : "text-foreground"}`}>{currency} {item.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryFilterBar({
  categories,
  activeIndex,
  onSelect,
  familyStyle,
}: {
  categories: EmenuCategory[];
  activeIndex: number;
  onSelect: (i: number) => void;
  familyStyle?: FamilyStyle | null;
}) {
  const fs = familyStyle;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
      <button
        onClick={() => onSelect(-1)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
          activeIndex === -1
            ? (fs ? fs.pillActive : "bg-foreground text-background")
            : (fs ? `${fs.pillBg} ${fs.pillText} hover:opacity-80` : "bg-muted text-muted-foreground hover:bg-muted/80")
        }`}
      >
        All
      </button>
      {categories.map((cat, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeIndex === i
              ? (fs ? fs.pillActive : "bg-foreground text-background")
              : (fs ? `${fs.pillBg} ${fs.pillText} hover:opacity-80` : "bg-muted text-muted-foreground hover:bg-muted/80")
          }`}
        >
          {cat.name || "Category"}
        </button>
      ))}
    </div>
  );
}

export function EmenuPreview({ schema }: EmenuPreviewProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);

  const templateFamily = (schema.template_family as string) || undefined;
  const familyStyle = getFamilyStyle(templateFamily);

  const rawCategories = (schema.categories as EmenuCategory[]) || [];
  const categories = rawCategories.filter((c) => !c._hidden);
  const layoutStyle = (schema.layout_style as "grid" | "list") || "grid";
  const currency = (schema.currency_symbol as string) || (schema.currency as string) || "$";
  const showImages = schema.show_images !== false;
  const showBadges = schema.show_badges !== false;
  const showDietary = schema.show_dietary !== false;
  const colsDesktop = (schema.columns_desktop as number) || (templateFamily === "zooom" ? 4 : templateFamily === "plateria" ? 3 : 2);

  const displayCategories = activeCategoryIndex === -1
    ? categories
    : [categories[activeCategoryIndex]].filter(Boolean);

  const gridCols = colsDesktop === 4 ? "grid-cols-4" : colsDesktop === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={`py-4 px-4 sm:px-6 ${familyStyle ? familyStyle.bg : ""}`}>
      <h3 className={`text-lg font-bold mb-1 ${familyStyle ? familyStyle.headingClass : "text-foreground"}`}>
        {(schema.heading as string) || "Our Menu"}
      </h3>
      {schema.description && (
        <p className={`text-sm mb-3 ${familyStyle ? familyStyle.mutedClass : "text-muted-foreground"}`}>{schema.description as string}</p>
      )}

      {categories.length > 1 && (
        <div className="mb-4">
          <CategoryFilterBar
            categories={categories}
            activeIndex={activeCategoryIndex}
            onSelect={setActiveCategoryIndex}
            familyStyle={familyStyle}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className={`text-center py-12 border-2 border-dashed rounded-xl ${familyStyle ? `${familyStyle.cardBorder} ${familyStyle.cardBg}` : "border-border/50"}`}>
          <p className={`text-sm mt-2 ${familyStyle ? familyStyle.mutedClass : "text-muted-foreground"}`}>No menu items added yet</p>
          <p className={`text-xs mt-1 opacity-60 ${familyStyle ? familyStyle.mutedClass : "text-muted-foreground/60"}`}>Add categories and items from the editor panel</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayCategories.map((cat, catIdx) => (
            <div key={catIdx}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-full object-cover" />
                ) : null}
                <div>
                  <h4 className={`text-sm font-semibold uppercase tracking-wide ${familyStyle ? familyStyle.textClass : "text-foreground"}`}>
                    {cat.name || "Category"}
                  </h4>
                  {cat.description && (
                    <p className={`text-xs ${familyStyle ? familyStyle.mutedClass : "text-muted-foreground"}`}>{cat.description}</p>
                  )}
                </div>
                {cat.items && (
                  <span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded-lg ${familyStyle ? `${familyStyle.pillBg} ${familyStyle.pillText}` : "text-muted-foreground bg-muted"}`}>
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
                      familyStyle={familyStyle}
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
                      familyStyle={familyStyle}
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
