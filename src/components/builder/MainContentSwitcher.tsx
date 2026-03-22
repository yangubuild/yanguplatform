import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeftRight, Loader2, ChevronDown } from "lucide-react";
import {
  getAllowedSwitchTargets,
  getEngineBlueprint,
  surfaceTypeToEngineKeyWithFallback,
} from "@/config/blueprintRegistry";
import { cn } from "@/lib/utils";

// ─── Human-readable labels for registry section types ───
const SECTION_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  product_grid: { label: "Products", icon: "🛍️" },
  services_list: { label: "Services", icon: "⚙️" },
  article_feed: { label: "Articles", icon: "📰" },
  case_studies_grid: { label: "Case Studies", icon: "📁" },
  booking_inventory: { label: "Booking", icon: "📅" },
  community_feed: { label: "Community Feed", icon: "💬" },
  media_grid: { label: "Media Grid", icon: "🖼️" },
  links_grid: { label: "Links", icon: "🔗" },
  listing_grid: { label: "Listings", icon: "📋" },
  properties: { label: "Properties", icon: "🏠" },
};

const VARIANT_LABELS: Record<string, string> = {
  grid: "Grid",
  list: "List",
  featured_only: "Featured Only",
  bundle_view: "Bundle View",
  compact_menu: "Compact Menu",
  default: "Default",
  mobile_compact: "Mobile Compact",
  magazine: "Magazine",
  cards: "Cards",
  posts: "Posts",
  events: "Events",
  media: "Media",
  discussions: "Discussions",
  masonry: "Masonry",
  reels_first: "Reels First",
};

interface MainContentSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitch: (newType: string) => Promise<string | null | void>;
  onVariantChange?: (displayMode: string) => void;
  surfaceType: string;
  currentMainContentType?: string | null;
  currentDisplayMode?: string | null;
  className?: string;
}

export function MainContentSwitcher({
  open,
  onOpenChange,
  onSwitch,
  onVariantChange,
  surfaceType,
  currentMainContentType,
  currentDisplayMode,
  className,
}: MainContentSwitcherProps) {
  const [switchingType, setSwitchingType] = useState<string | null>(null);

  const engineKey = surfaceTypeToEngineKeyWithFallback(surfaceType);
  const registryTargets = getAllowedSwitchTargets(engineKey);
  const bp = getEngineBlueprint(engineKey);
  const variantConfig = bp?.slots.main_content?.variants;

  // Guardrail: if current type isn't in registry targets, prepend it as a legacy item
  const currentIsLegacy =
    currentMainContentType != null &&
    currentMainContentType !== "" &&
    !registryTargets.includes(currentMainContentType);

  const targets = currentIsLegacy
    ? [currentMainContentType!, ...registryTargets]
    : registryTargets;

  // Only show variants if the current type matches a registered target
  const showVariants =
    variantConfig &&
    variantConfig.allowed.length> 1 &&
    currentMainContentType &&
    registryTargets.includes(currentMainContentType);

  const handleSelect = async (type: string) => {
    if (type === currentMainContentType || switchingType) return;
    onOpenChange(false);
    setSwitchingType(type);
    try {
      await onSwitch(type);
    } finally {
      setSwitchingType(null);
    }
  };

  // If only 1 registered target (no legacy) and no variants, hide entirely
  if (registryTargets.length <= 1 && !currentIsLegacy && !showVariants) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "h-6 w-6 shrink-0 rounded-md inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors",
            className
          )}
          aria-label="Switch main content type">
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start" side="right">
        {/* Section type switcher — only if>1 target */}
        {targets.length> 1 && (
          <>
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="h-3 w-3" />
                Content Type
              </p>
            </div>
            <div className="space-y-0.5">
              {targets.map((type) => {
                const meta = SECTION_TYPE_LABELS[type] || { label: type.replace(/_/g, " "), icon: "📄" };
                const isCurrent = type === currentMainContentType;
                const isSwitching = switchingType === type;
                const isLegacy = currentIsLegacy && type === currentMainContentType;
                return (
                  <button
                    key={type}
                    onClick={() => !isCurrent && !isLegacy && handleSelect(type)}
                    disabled={isCurrent || !!switchingType}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors text-left",
                      isCurrent
                        ? "bg-primary/10 text-primary font-medium cursor-default"
                        : "hover:bg-muted",
                      isLegacy && "opacity-70"
                    )}>
                    <span>{meta.icon}</span>
                    <span className="flex-1">{meta.label}</span>
                    {isCurrent && !isLegacy && (
                      <span className="text-[10px] text-primary/70">Current</span>
                    )}
                    {isLegacy && (
                      <span className="text-[10px] text-muted-foreground">Current · Legacy</span>
                    )}
                    {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Variant / display mode selector */}
        {showVariants && variantConfig && onVariantChange && (
          <>
            <div className="px-3 py-1.5 mt-1 border-t border-border pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ChevronDown className="h-3 w-3" />
                Display Mode
              </p>
            </div>
            <div className="space-y-0.5">
              {variantConfig.allowed.map((mode) => {
                const isCurrent = mode === (currentDisplayMode || variantConfig.default);
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (!isCurrent) onVariantChange(mode);
                    }}
                    disabled={isCurrent}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors text-left",
                      isCurrent
                        ? "bg-accent/10 text-accent-foreground font-medium cursor-default"
                        : "hover:bg-muted"
                    )}>
                    <span className="flex-1">{VARIANT_LABELS[mode] || mode}</span>
                    {isCurrent && (
                      <span className="text-[10px] text-muted-foreground">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
