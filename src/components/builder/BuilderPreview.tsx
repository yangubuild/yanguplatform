import { useEffect } from "react";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { Card } from "@/components/primitives";
import type { BuilderTheme } from "./BuilderSettingsDrawer";
import { DEFAULT_THEME } from "./BuilderSettingsDrawer";
import type { PageEditSettings } from "@/config/builderCoreSections";
import { DEFAULT_PAGE_SETTINGS } from "@/config/builderCoreSections";

interface BuilderPreviewProps {
  sections: EditorSection[];
  surfaceTitle: string;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
  theme?: BuilderTheme;
  pageSettings?: PageEditSettings;
  /** Live override for a single section's schema (before save) */
  liveSchemaOverride?: { sectionId: string; schema: Record<string, unknown> } | null;
}

// ─── Existing live_bio renderers (unchanged) ───

function isYouTubeUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

function hexToHslParts(hex: string): { h: number; s: number; l: number } | null {
  const normalized = hex.trim();
  const match = normalized.match(/^#([A-Fa-f0-9]{6})$/);
  if (!match) return null;

  const raw = match[1];
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }

  h = Math.round((h * 60 + 360) % 360);
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function toHslToken({ h, s, l }: { h: number; s: number; l: number }): string {
  return `${h} ${s}% ${l}%`;
}

const DEMO_IMAGES = [
  "https://picsum.photos/seed/yangu-store-1/1200/900",
  "https://picsum.photos/seed/yangu-store-2/1200/900",
  "https://picsum.photos/seed/yangu-store-3/1200/900",
  "https://picsum.photos/seed/yangu-store-4/1200/900",
  "https://picsum.photos/seed/yangu-store-5/1200/900",
  "https://picsum.photos/seed/yangu-store-6/1200/900",
  "https://picsum.photos/seed/yangu-store-7/1200/900",
  "https://picsum.photos/seed/yangu-store-8/1200/900",
];

const demoImage = (index: number) => DEMO_IMAGES[index % DEMO_IMAGES.length];

function HeroPreview({ schema }: { schema: Record<string, unknown> }) {
  const media = (schema.media as { type?: string; url?: string; fit?: string }) || {};
  const mediaType = media.type || "none";
  const mediaUrl = media.url || "";
  const resolvedMediaUrl = mediaUrl || demoImage(0);
  const mediaFit = media.fit || "contain";
  const ctaText = (schema.cta_text as string) || "";
  const ctaHref = (schema.cta_href as string) || "";
  const layoutVariant = (schema.layout_variant as string) || "";
  const bgStyle = (schema.background_style as string) || "";
  const bgColor = (schema.background_color as string) || "";
  const description = (schema.description as string) || "";
  const textColor = (schema.text_color as string) || "";
  const typographyStyle = (schema.typography_style as string) || "";

  const isSplit = layoutVariant === "split";
  const isDark = bgStyle === "solid_dark" || textColor === "light";
  const isBoldUppercase = typographyStyle === "bold_uppercase";
  const isEditorialLarge = typographyStyle === "editorial_large";

  // Split layout: text left, image right
  if (isSplit) {
    return (
      <div
        className="flex items-stretch overflow-hidden rounded-lg"
        style={{ backgroundColor: bgColor || "hsl(var(--accent) / 0.1)" }}
      >
        <div className="flex-1 py-8 px-6 flex flex-col justify-center">
          {schema.subheadline && !isEditorialLarge && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {schema.subheadline as string}
            </p>
          )}
          <h1 className={`font-bold text-foreground ${isEditorialLarge ? "text-xl leading-tight" : "text-lg"}`}>
            {(schema.headline as string) || "Your Headline"}
          </h1>
          {isEditorialLarge && schema.subheadline && (
            <p className="text-xs text-muted-foreground mt-1">{schema.subheadline as string}</p>
          )}
          {description && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{description}</p>
          )}
          {ctaText && (
            <div className="mt-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium">
                {ctaText}
              </span>
            </div>
          )}
        </div>
        <div className="w-2/5 bg-muted overflow-hidden">
          {mediaType === "video" && mediaUrl ? (
            <video src={mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={resolvedMediaUrl} alt="Hero visual" className="w-full h-full object-cover" />
          )}
        </div>
      </div>
    );
  }

  // Fullwidth center (dark hero)
  if (isDark || layoutVariant === "fullwidth_center") {
    return (
      <div
        className="py-12 px-6 text-center rounded-lg relative overflow-hidden"
        style={{ backgroundColor: bgColor || "hsl(0 0% 8%)" }}
      >
        {mediaType !== "video" && resolvedMediaUrl && (
          <img src={resolvedMediaUrl} alt="Hero visual" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative z-10">
          <h1 className={`font-bold text-white ${isBoldUppercase ? "text-2xl tracking-[0.15em] uppercase" : "text-2xl"}`}>
            {(schema.headline as string) || "Your Headline"}
          </h1>
          {schema.subheadline && (
            <p className="mt-3 text-white/70 text-[10px] leading-relaxed max-w-[280px] mx-auto">
              {schema.subheadline as string}
            </p>
          )}
          {ctaText && (
            <div className="mt-4">
              <span className="inline-block px-5 py-2 rounded-full bg-white text-black text-xs font-medium">{ctaText}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default hero
  return (
    <div className="py-12 px-6 text-center bg-gradient-to-b from-accent/10 to-transparent rounded-lg">
      {mediaType !== "video" && resolvedMediaUrl && (
        <div className={`aspect-video rounded-lg mb-4 overflow-hidden ${mediaFit === "contain" ? "bg-muted" : ""}`}>
          <img src={resolvedMediaUrl} alt="Hero visual" className={`w-full h-full ${mediaFit === "cover" ? "object-cover" : "object-contain"}`} />
        </div>
      )}
      {mediaType === "video" && mediaUrl && (() => {
        const ytId = isYouTubeUrl(mediaUrl);
        return ytId ? (
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
          </div>
        ) : (
          <video src={mediaUrl} controls className="w-full rounded-lg mb-4" />
        );
      })()}
      <h1 className="text-2xl font-bold text-foreground">{(schema.headline as string) || "Your Headline"}</h1>
      {schema.subheadline && <p className="mt-2 text-muted-foreground">{schema.subheadline as string}</p>}
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
      {ctaText && (
        <div className="mt-4">
          <a href={ctaHref || "#"} className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">{ctaText}</a>
        </div>
      )}
    </div>
  );
}

function BioPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-6 px-6">
      <p className="text-sm text-muted-foreground">
        {(schema.text as string) || "Your bio goes here..."}
      </p>
    </div>
  );
}

function LinksPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ label?: string; url?: string }>) || [];
  return (
    <div className="py-4 px-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No links added yet</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="block p-3 rounded-lg border border-border bg-muted/50 text-sm text-center">
            {item.label || item.url || "Link"}
          </div>
        ))
      )}
    </div>
  );
}

function SocialPreview({ schema }: { schema: Record<string, unknown> }) {
  const handles = (schema.handles as Record<string, string>) || {};
  const entries = Object.entries(handles);
  return (
    <div className="py-4 px-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Socials</p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No socials added</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {entries.map(([platform, handle]) => (
            <span key={platform} className="px-2 py-1 rounded bg-muted text-xs">
              {platform}: {handle}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CtaPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-6 px-6 text-center">
      <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        {(schema.label as string) || "Contact"}
      </button>
    </div>
  );
}

function VideoPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-4 px-6">
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {(schema.url as string) ? "🎬 Video" : "No video URL set"}
        </p>
      </div>
    </div>
  );
}

function GalleryPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ src?: string; image_url?: string } | string>) || [];
  const galleryItems = items.length > 0
    ? items.slice(0, 6).map((item, i) => {
        if (typeof item === "string") return item;
        return item.src || item.image_url || demoImage(i + 1);
      })
    : Array.from({ length: 6 }, (_, i) => demoImage(i + 1));

  return (
    <div className="py-4 px-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Gallery</p>
      <div className="grid grid-cols-3 gap-2">
        {galleryItems.map((src, i) => (
          <div key={i} className="aspect-square rounded bg-muted overflow-hidden">
            <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── New section type renderers ───

function TextPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {(schema.heading as string) || "Text Section"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {(schema.body as string) || "Content goes here..."}
      </p>
    </div>
  );
}

function OfferPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ title?: string; price?: string; description?: string; icon?: string }>) || [];
  const displayMode = (schema.display_mode as string) || (schema.layout_variant as string) || "";
  const storyBlock = schema.story_block as { enabled?: boolean; eyebrow?: string; heading?: string; description?: string; cta_text?: string } | undefined;
  const socialGallery = schema.social_gallery as { enabled?: boolean; platform?: string; heading?: string; subheading?: string; hashtag?: string; columns?: number } | undefined;
  const newsletter = schema.newsletter as { enabled?: boolean; heading?: string; description?: string; cta_text?: string } | undefined;
  const testimonials = schema.testimonials as { enabled?: boolean; heading?: string; subheading?: string; items?: Array<{ name?: string; quote?: string; location?: string; label?: string }> } | undefined;

  const isTrustBadges = displayMode === "trust_badges";
  const isStoryBlock = displayMode === "story_block";

  return (
    <div className="py-4 px-6 space-y-5">
      {/* Main heading */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {(schema.heading as string) || "What We Offer"}
        </h3>
        {schema.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{schema.description as string}</p>
        )}
      </div>

      {/* Trust badges layout */}
      {isTrustBadges && items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <div className="text-lg mb-1">
                {item.icon === "truck" ? "🚚" : item.icon === "headphones" ? "🎧" : item.icon === "credit-card" ? "💳" : item.icon === "map-pin" ? "📍" : "✨"}
              </div>
              <p className="text-[11px] font-medium">{item.title || "Feature"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.description || ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Story block sub-section */}
      {isStoryBlock && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1/3 aspect-square rounded-lg bg-muted flex items-center justify-center text-xl">🖼</div>
              <div className="flex-1">
                <p className="text-xs font-semibold">{item.title || "Story"}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.description || ""}</p>
              </div>
            </div>
          ))}
          {schema.cta_text && (
            <span className="inline-block px-4 py-1.5 rounded-full border border-border text-xs font-medium">{schema.cta_text as string}</span>
          )}
        </div>
      )}

      {/* Regular items (fallback) */}
      {!isTrustBadges && !isStoryBlock && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{item.title || "Offer"}</p>
                {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
              </div>
              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !storyBlock?.enabled && !socialGallery?.enabled && !newsletter?.enabled && !testimonials?.enabled && (
        <p className="text-sm text-muted-foreground/60 italic">No offers added</p>
      )}

      {/* Story block (embedded in trust_badges mode) */}
      {storyBlock?.enabled && (
        <div className="border-t border-border pt-4">
          {storyBlock.eyebrow && <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{storyBlock.eyebrow}</p>}
          <p className="text-xs font-medium leading-relaxed">{storyBlock.heading || ""}</p>
          {storyBlock.description && <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{storyBlock.description}</p>}
          {storyBlock.cta_text && (
            <span className="inline-block mt-2 px-4 py-1.5 rounded-full border border-border text-[10px] font-medium">{storyBlock.cta_text}</span>
          )}
        </div>
      )}

      {/* Testimonials sub-section */}
      {testimonials?.enabled && (testimonials.items || []).length > 0 && (
        <div className="border-t border-border pt-4">
          {testimonials.subheading && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{testimonials.subheading}</p>}
          <h4 className="text-xs font-semibold mb-2">{testimonials.heading || "Reviews"}</h4>
          <div className="space-y-2">
            {(testimonials.items || []).map((t, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                {t.label && <span className="text-[10px] font-medium text-primary">{t.label}</span>}
                <p className="text-[11px] italic text-muted-foreground mt-1">"{t.quote || "..."}"</p>
                <p className="text-[10px] font-medium mt-1">— {t.name || "Customer"}{t.location ? `, ${t.location}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social gallery sub-section */}
      {socialGallery?.enabled && (
        <div className="border-t border-border pt-4">
          {socialGallery.subheading && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{socialGallery.subheading}</p>}
          {socialGallery.heading && <h4 className="text-xs font-semibold mb-2">{socialGallery.heading}</h4>}
          <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${Math.min(socialGallery.columns || 4, 5)}, 1fr)` }}>
            {Array.from({ length: socialGallery.columns || 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-muted flex items-center justify-center">
                <span className="text-muted-foreground/40 text-sm">📷</span>
              </div>
            ))}
          </div>
          {socialGallery.hashtag && <p className="text-[10px] text-muted-foreground mt-1 text-center">{socialGallery.hashtag}</p>}
        </div>
      )}

      {/* Newsletter sub-section */}
      {newsletter?.enabled && (
        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-semibold">{newsletter.heading || "Subscribe"}</h4>
          {newsletter.description && <p className="text-[10px] text-muted-foreground mt-1">{newsletter.description}</p>}
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 h-8 rounded border border-border bg-background px-2 flex items-center">
              <span className="text-[10px] text-muted-foreground">your@email.com</span>
            </div>
            <span className="px-3 h-8 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center">{newsletter.cta_text || "Subscribe"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PlansPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ name?: string; price?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Plans"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No plans added</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50 text-center">
              <p className="text-sm font-medium">{item.name || "Plan"}</p>
              {item.price && <p className="text-xs text-muted-foreground">{item.price}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RulesPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ text?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Rules"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No rules defined</p>
      ) : (
        <ol className="space-y-1 list-decimal list-inside">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground">{item.text || `Rule ${i + 1}`}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function JoinPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-6 px-6 text-center">
      {schema.description && (
        <p className="text-sm text-muted-foreground mb-3">{schema.description as string}</p>
      )}
      <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        {(schema.label as string) || "Join Now"}
      </button>
    </div>
  );
}

function ProductsPreview({ schema }: { schema: Record<string, unknown> }) {
  const products = ((schema.products as Array<{
    name?: string; title?: string; price?: string; description?: string; images?: string[]; badge?: string; media?: Array<{ src?: string }>;
  }>) || []).map((p) => ({
    name: p.name || p.title || "",
    price: p.price || "",
    description: p.description || "",
    badge: p.badge || "",
    image_url: p.images?.[0] || (p.media as Array<{ src?: string }>)?.[0]?.src || "",
  }));

  const legacyItems = ((schema.items as Array<{ name?: string; title?: string; price?: string; description?: string; image_url?: string; badge?: string; media?: Array<{ src?: string }> }>) || []).map((item) => ({
    name: item.name || item.title || "",
    price: item.price || "",
    description: item.description || "",
    badge: item.badge || "",
    image_url: item.image_url || (item.media as Array<{ src?: string }>)?.[0]?.src || "",
  }));

  const items = products.length > 0 ? products : legacyItems;
  const seededItems = items.length > 0
    ? items
    : [
        { name: "Modern Chair", price: "$89", image_url: demoImage(0), badge: "New" },
        { name: "Stone Mug", price: "$24", image_url: demoImage(1), badge: "Hot" },
        { name: "Table Lamp", price: "$56", image_url: demoImage(2), badge: "" },
        { name: "Wall Mirror", price: "$112", image_url: demoImage(3), badge: "" },
        { name: "Linen Set", price: "$78", image_url: demoImage(4), badge: "" },
        { name: "Shelf Decor", price: "$34", image_url: demoImage(5), badge: "" },
      ];
  const gridSettings = (schema.grid as { columns_desktop?: number; columns_mobile?: number; gap?: string }) || {};
  const cols = Math.min(gridSettings.columns_desktop || 2, 4);
  const cardSettings = (schema.cards as { style?: string; image_ratio?: string; show_price?: boolean; show_title?: boolean; show_cta?: boolean; card_style?: string; hover_effect?: string; badge_enabled?: boolean }) || {};
  const isSquare = cardSettings.image_ratio === "square";
  const isPortrait = cardSettings.image_ratio === "portrait";
  const showCta = cardSettings.show_cta !== false;

  return (
    <div className="py-4 px-6">
      {schema.heading && (
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {schema.heading as string}
        </h3>
      )}
      {schema.description && (
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{schema.description as string}</p>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {seededItems.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden group">
            <div className={`bg-muted relative ${isPortrait ? "aspect-[3/4]" : isSquare ? "aspect-square" : "aspect-video"}`}>
              <img src={item.image_url || demoImage(i)} alt={item.name || "Product"} className="w-full h-full object-cover" />
              {item.badge && cardSettings.badge_enabled !== false && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary text-primary-foreground">{item.badge}</span>
              )}
            </div>
            <div className="p-2">
              <p className="text-[11px] font-medium truncate">{item.name || "Product"}</p>
              {item.price && <p className="text-[10px] text-primary font-semibold">{item.price}</p>}
              {showCta && (
                <span className="mt-1.5 block text-center text-[9px] font-medium py-1 rounded border border-border text-muted-foreground">Add to Cart</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ name?: string; icon?: string; image_url?: string; media?: Array<{ src?: string }> }>) || [];
  const seeded = items.length > 0
    ? items
    : ["Living", "Kitchen", "Office", "Wellness", "Outdoor", "Decor"].map((name, i) => ({ name, image_url: demoImage(i + 2) }));

  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Categories"}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {seeded.slice(0, 9).map((item, i) => {
          const src = item.image_url || item.media?.[0]?.src || demoImage(i + 2);
          return (
            <div key={i} className="rounded-lg overflow-hidden border border-border bg-card">
              <div className="aspect-square bg-muted">
                <img src={src} alt={item.name || "Category"} className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] font-medium p-1.5 text-center truncate">{item.name || "Category"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListingsPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ title?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Listings"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No listings added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50 text-sm">
              {item.title || "Listing"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FiltersPreview({ schema }: { schema: Record<string, unknown> }) {
  const keys = (schema.keys as string[]) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Filters"}
      </h3>
      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No filters configured</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keys.map((k, i) => (
            <span key={i} className="px-3 py-1 rounded-full border border-border text-xs">
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ name?: string; price?: string; description?: string; icon?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Services"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No services added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">
                  {item.icon && <span className="mr-1.5">{item.icon}</span>}
                  {item.name || "Service"}
                </p>
                {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
              </div>
              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ title?: string; description?: string; image_url?: string; href?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.title as string) || "Featured"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No featured items</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50">
              {item.image_url && (
                <div className="aspect-video rounded overflow-hidden mb-2 bg-muted">
                  <img src={item.image_url} alt={item.title || ""} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-sm font-medium">{item.title || "Item"}</p>
              {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
              {item.href && <p className="text-xs text-primary mt-1 truncate">{item.href}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ name?: string; quote?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Testimonials"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No testimonials added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50">
              <p className="text-sm italic text-muted-foreground">"{item.quote || "..."}"</p>
              <p className="text-xs font-medium mt-1">— {item.name || "Anonymous"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ question?: string; answer?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "FAQ"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No FAQ items added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-muted/50">
              <p className="text-sm font-medium">{item.question || "Question?"}</p>
              {item.answer && <p className="text-xs text-muted-foreground mt-1">{item.answer}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactPreview({ schema }: { schema: Record<string, unknown> }) {
  const email = (schema.email as string) || "hello@yourstore.com";
  const phone = (schema.phone as string) || "+1 (000) 000-0000";
  const address = (schema.address as string) || "123 Your Street, City";

  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Contact"}
      </h3>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>✉️ {email}</p>
        <p>📞 {phone}</p>
        <p>📍 {address}</p>
      </div>
    </div>
  );
}

function SchedulePreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ time?: string; title?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Schedule"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No schedule items</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="font-medium text-muted-foreground">{item.time || "TBD"}</span>
              <span>{item.title || "Event"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuPreview({ schema }: { schema: Record<string, unknown> }) {
  const categories = (schema.categories as Array<{ name?: string; items?: Array<{ name?: string; price?: string }> }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Menu"}
      </h3>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No menu items added</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <div key={i}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cat.name || "Category"}</p>
              {(cat.items || []).map((item, j) => (
                <div key={j} className="flex justify-between text-sm py-0.5">
                  <span>{item.name || "Item"}</span>
                  {item.price && <span className="text-muted-foreground">{item.price}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HoursPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ day?: string; hours?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Opening Hours"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No hours set</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="font-medium">{item.day || "Day"}</span>
              <span className="text-muted-foreground">{item.hours || "Closed"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LocationPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Location"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {(schema.address as string) || "No address set"}
      </p>
      {schema.mapUrl && (
        <div className="mt-2 aspect-video rounded-lg bg-muted flex items-center justify-center">
          <p className="text-xs text-muted-foreground">📍 Map</p>
        </div>
      )}
    </div>
  );
}

function AboutPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        {(schema.heading as string) || "About Us"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {(schema.body as string) || "Tell people about your community..."}
      </p>
    </div>
  );
}

function GenericPreview({ section }: { section: EditorSection }) {
  return (
    <div className="py-4 px-6">
      <p className="text-sm text-muted-foreground italic">
        {section.section_type} section
      </p>
    </div>
  );
}

// ─── Preview map ───
// ─── Header preview ───
function HeaderPreview({ schema }: { schema: Record<string, unknown> }) {
  const logoUrl = (schema.logo_url as string) || "";
  const logoPosition = (schema.logo_position as string) || "left";
  const logoSize = (schema.logo_size as string) || "medium";
  const showName = schema.show_name !== false;
  const showCart = schema.show_cart_icon as boolean;
  const showSearch = schema.show_search as boolean;
  const navItems = (schema.nav_items as string[]) || (schema.nav_items_left as string[]) || [];
  const layoutVariant = (schema.layout_variant as string) || "";
  const bgStyle = (schema.background_style as string) || "";
  const isDark = bgStyle === "dark";
  const sizeMap: Record<string, string> = { small: "h-8 w-8", medium: "h-10 w-10", large: "h-14 w-14" };

  const isCenterLogo = logoPosition === "center" || layoutVariant === "nav_split";

  return (
    <div className={`py-2.5 px-4 flex items-center gap-2 ${isDark ? "bg-foreground/90" : ""}`}>
      {/* Left nav items (for split layout) */}
      {isCenterLogo && navItems.length > 0 && (
        <div className="flex gap-2 flex-1">
          {navItems.slice(0, 3).map((item, i) => (
            <span key={i} className={`text-[10px] ${isDark ? "text-background/70" : "text-muted-foreground"}`}>{item}</span>
          ))}
        </div>
      )}

      {/* Logo */}
      <div className={`flex items-center gap-2 ${isCenterLogo ? "" : "flex-1"}`}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className={`${sizeMap[logoSize] || "h-10 w-10"} object-contain rounded`} />
        ) : (
          <div className={`${sizeMap[logoSize] || "h-10 w-10"} bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground`}>Logo</div>
        )}
        {showName && <span className={`text-xs font-semibold ${isDark ? "text-background" : "text-foreground"}`}>Store</span>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {!isCenterLogo && navItems.length > 0 && navItems.slice(0, 3).map((item, i) => (
          <span key={i} className={`text-[10px] ${isDark ? "text-background/70" : "text-muted-foreground"}`}>{item}</span>
        ))}
        {isCenterLogo && (schema.nav_items_right as string[] || []).slice(0, 2).map((item, i) => (
          <span key={i} className={`text-[10px] ${isDark ? "text-background/70" : "text-muted-foreground"}`}>{item}</span>
        ))}
        {showSearch && <span className="text-sm">🔍</span>}
        {showCart && <span className="text-sm">🛒</span>}
      </div>
    </div>
  );
}

// ─── Footer preview ───
function FooterPreview({ schema }: { schema: Record<string, unknown> }) {
  const social = (schema.social as Record<string, string>) || {};
  const hours = (schema.hours as Array<{ day?: string; hours?: string }>) || [];
  const socialEntries = Object.entries(social).filter(([, v]) => v);
  const columns = (schema.columns as Array<{ title?: string; links?: string[] }>) || [];
  const isMultiColumn = (schema.layout_variant as string) === "multi_column" || columns.length > 0;
  const copyright = (schema.copyright as string) || "";
  const newsletterEnabled = schema.newsletter_enabled as boolean;
  const newsletterHeading = (schema.newsletter_heading as string) || "";
  const newsletterDesc = (schema.newsletter_description as string) || "";

  return (
    <div className="py-4 px-6 bg-muted/30 space-y-3">
      {/* Newsletter in footer */}
      {newsletterEnabled && (
        <div className="pb-3 border-b border-border">
          <h4 className="text-xs font-semibold">{newsletterHeading || "Subscribe"}</h4>
          {newsletterDesc && <p className="text-[10px] text-muted-foreground mt-1">{newsletterDesc}</p>}
          <div className="flex gap-1.5 mt-2">
            <div className="flex-1 h-7 rounded border border-border bg-background px-2 flex items-center">
              <span className="text-[10px] text-muted-foreground">your@email.com</span>
            </div>
            <span className="px-3 h-7 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center">Subscribe</span>
          </div>
        </div>
      )}

      {/* Multi-column links */}
      {isMultiColumn && columns.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 3)}, 1fr)` }}>
          {columns.map((col, i) => (
            <div key={i}>
              <p className="text-[10px] font-semibold mb-1">{col.title || "Links"}</p>
              {(col.links || []).map((link, j) => (
                <p key={j} className="text-[10px] text-muted-foreground leading-relaxed">{link}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Traditional footer info */}
      {!isMultiColumn && (
        <>
          <h3 className="text-sm font-semibold text-foreground mb-2">Footer</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {schema.email && <p>✉️ {schema.email as string}</p>}
            {schema.phone && <p>📞 {schema.phone as string}</p>}
            {schema.address && <p>📍 {schema.address as string}</p>}
          </div>
        </>
      )}

      {socialEntries.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {socialEntries.map(([platform, handle]) => (
            <span key={platform} className="px-2 py-0.5 rounded bg-muted text-[10px]">{platform}: {handle}</span>
          ))}
        </div>
      )}
      {hours.length > 0 && (
        <div className="space-y-0.5">
          {hours.map((h, i) => (
            <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
              <span>{h.day || "Day"}</span>
              <span>{h.hours || "Closed"}</span>
            </div>
          ))}
        </div>
      )}
      {copyright && <p className="text-[9px] text-muted-foreground/60 text-center pt-2 border-t border-border">{copyright}</p>}
    </div>
  );
}

export const PREVIEW_MAP: Record<string, React.ComponentType<{ schema: Record<string, unknown> }>> = {
  hero: HeroPreview,
  hero_banner: HeroPreview,
  header: HeaderPreview,
  header_logo: HeaderPreview,
  bio: BioPreview,
  links: LinksPreview,
  links_grid: LinksPreview,
  social: SocialPreview,
  cta: CtaPreview,
  cta_block: CtaPreview,
  newsletter: CtaPreview,
  video: VideoPreview,
  gallery: GalleryPreview,
  instagram_gallery: GalleryPreview,
  media_grid: GalleryPreview,
  text: TextPreview,
  about: AboutPreview,
  offer: OfferPreview,
  offers: OfferPreview,
  promo: OfferPreview,
  promo_banner: OfferPreview,
  trust_badges: OfferPreview,
  plans: PlansPreview,
  rules: RulesPreview,
  join: JoinPreview,
  products: ProductsPreview,
  product_grid: ProductsPreview,
  reviews: ProductsPreview,
  categories: CategoriesPreview,
  category_grid: CategoriesPreview,
  collections: CategoriesPreview,
  listings: ListingsPreview,
  listing_grid: ListingsPreview,
  filters: FiltersPreview,
  services: ServicesPreview,
  services_list: ServicesPreview,
  featured: FeaturedPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  contact: ContactPreview,
  contact_section: ContactPreview,
  schedule: SchedulePreview,
  menu: MenuPreview,
  hours: HoursPreview,
  location: LocationPreview,
  footer: FooterPreview,
  properties: ListingsPreview,
  article_feed: TextPreview,
  case_studies_grid: FeaturedPreview,
  booking_inventory: ListingsPreview,
  community_feed: TextPreview,
};

export function BuilderPreview({ sections, surfaceTitle, selectedSectionId, onSelectSection, theme, pageSettings, liveSchemaOverride }: BuilderPreviewProps) {
  const t = theme || DEFAULT_THEME;
  const ps = pageSettings || DEFAULT_PAGE_SETTINGS;
  const isLayoutB = ps.layout === "layout_b";

  // Console proof for layout switching
  useEffect(() => {
    console.log("BUILDER_LAYOUT_SWITCHED", { layout: isLayoutB ? "B" : "A", wireframeId: ps.layout });
  }, [ps.layout, isLayoutB]);

  const selectedColor = (ps.background_color || "").trim();
  const parsedColor = hexToHslParts(selectedColor);
  const primaryToken = parsedColor ? toHslToken(parsedColor) : null;
  const baseForegroundToken = parsedColor ? (parsedColor.l > 60 ? "222 47% 11%" : "210 40% 98%") : null;
  const pageFontToken = ps.font_color ? toHslToken(hexToHslParts(ps.font_color) || { h: 222, s: 47, l: 11 }) : null;
  const resolvedForegroundToken = pageFontToken || baseForegroundToken;
  const cardToken = parsedColor
    ? `${parsedColor.h} ${Math.max(12, Math.min(parsedColor.s, 45))}% ${Math.max(16, Math.min(parsedColor.l + (parsedColor.l > 50 ? -8 : 10), 94))}%`
    : null;

  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = ps.theme_mode === "dark" || (ps.theme_mode === "both" && prefersDark);

  const themeStyle: React.CSSProperties = {
    fontFamily: ps.font_family || t.font_family,
    fontWeight: Number(t.body_weight),
    "--builder-heading-weight": t.heading_weight,
    ...(primaryToken ? { "--primary": primaryToken, "--accent": primaryToken, "--ring": primaryToken } : {}),
    ...(resolvedForegroundToken ? { "--foreground": resolvedForegroundToken, "--muted-foreground": resolvedForegroundToken } : {}),
    ...(primaryToken && !isDark ? { "--background": primaryToken, "--card": cardToken || primaryToken } : {}),
    ...(isDark
      ? {
          "--background": "240 17% 12%",
          "--foreground": resolvedForegroundToken || "210 40% 98%",
          "--card": cardToken || "240 17% 14%",
          "--muted": "240 10% 20%",
          "--border": "240 10% 30%",
        }
      : {}),
  } as React.CSSProperties;

  if (sections.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-lg font-semibold text-muted-foreground">No sections yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Add sections from the left panel to start building your page.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto border border-border rounded-xl overflow-hidden shadow-sm bg-background text-foreground" style={themeStyle}>
      {/* Phone-like frame header */}
      <div className="bg-muted/50 border-b border-border px-4 py-2">
        <p className="text-xs text-muted-foreground text-center truncate">{surfaceTitle}</p>
      </div>

      {/* Sections — Layout A = stacked with dividers, Layout B = compact cards */}
      <div className={isLayoutB ? "p-2 space-y-2" : "divide-y divide-border"}>
        {sections
          .filter((s) => s.is_visible)
          .map((section) => {
            const Preview = PREVIEW_MAP[section.section_type];
            const displaySchema = (liveSchemaOverride && liveSchemaOverride.sectionId === section.id)
              ? liveSchemaOverride.schema
              : section.schema;

            const sectionFontParts = hexToHslParts((displaySchema.section_font_color as string) || "");
            const sectionBgParts = hexToHslParts((displaySchema.section_background_color as string) || "");
            const sectionFontFamily = (displaySchema.section_font_family as string) || "";
            const sectionStyle: React.CSSProperties = {
              ...(sectionBgParts ? { "--card": toHslToken(sectionBgParts), "--muted": toHslToken(sectionBgParts) } : {}),
              ...(sectionFontParts ? { "--foreground": toHslToken(sectionFontParts), "--muted-foreground": toHslToken(sectionFontParts) } : {}),
              ...(sectionFontFamily ? { fontFamily: sectionFontFamily } : {}),
            } as React.CSSProperties;

            return (
              <div
                key={section.id}
                onClick={() => onSelectSection?.(section.id)}
                style={sectionStyle}
                className={`cursor-pointer transition-all ${
                  isLayoutB
                    ? "rounded-lg border border-border bg-card shadow-sm"
                    : "border-b border-border last:border-b-0"
                } ${selectedSectionId === section.id ? "ring-2 ring-primary ring-inset" : "hover:bg-accent/5"}`}
              >
                {Preview ? <Preview schema={displaySchema} /> : <GenericPreview section={section} />}
              </div>
            );
          })}
      </div>

      {/* Floating CTA preview */}
      {ps.floating_cta && (
        <div className="sticky bottom-0 p-3 flex justify-end">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground text-lg">
              {(ps.floating_cta_channel || "whatsapp") === "whatsapp" ? "💬" : "✉️"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
