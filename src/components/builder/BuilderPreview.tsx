import { useState, useEffect, useRef } from "react";
import { DEFAULT_PRIMARY_IDS, getPlatform, type SocialSlot } from "@/lib/socialPlatformRegistry";
import type { EditorSection } from "@/hooks/useBuilderEditor";
import { ctaLabel } from "./editors/ItemCtaSelector";
import { Card } from "@/components/primitives";
import type { BuilderTheme } from "./BuilderSettingsDrawer";
import { DEFAULT_THEME } from "./BuilderSettingsDrawer";
import type { PageEditSettings } from "@/config/builderCoreSections";
import { DEFAULT_PAGE_SETTINGS } from "@/config/builderCoreSections";
import { CanvasSectionControls } from "./canvas/CanvasSectionControls";
import { CanvasItemControls } from "./canvas/CanvasItemControls";
import { CanvasHints } from "./canvas/CanvasHints";
import { CanvasEditableText } from "./canvas/CanvasEditableText";
import { CanvasImagePopover } from "./canvas/CanvasImagePopover";

interface CanvasCallbacks {
  sectionId: string;
  onUpdateField?: (sectionId: string, fieldPath: string, value: unknown) => void;
  onImageReplace?: (sectionId: string, fieldPath: string, url: string, source: string) => void;
}

interface BuilderPreviewProps {
  sections: EditorSection[];
  surfaceTitle: string;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
  theme?: BuilderTheme;
  pageSettings?: PageEditSettings;
  liveSchemaOverride?: { sectionId: string; schema: Record<string, unknown> } | null;
  onUpdateSectionField?: (sectionId: string, fieldPath: string, value: unknown) => void;
  onHideSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onImageReplace?: (sectionId: string, fieldPath: string, url: string, source: string) => void;
  previewViewport?: "desktop" | "mobile";
  /** All pages for the surface — used for page-based header nav links */
  pages?: Array<{ id: string; slug: string; title: string }>;
  /** Called when a header nav item targets a different page */
  onSwitchPage?: (pageId: string) => void;
}

// ─── Helpers ───

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
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
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

/** Remove item at index from an array field in schema via canvas */
function removeItemAtIndex(canvas: CanvasCallbacks | undefined, fieldPath: string, items: unknown[], index: number) {
  if (!canvas?.onUpdateField) return;
  const updated = items.filter((_, i) => i !== index);
  canvas.onUpdateField(canvas.sectionId, fieldPath, updated);
}

/** Hide item at index by setting hidden flag */
function hideItemAtIndex(canvas: CanvasCallbacks | undefined, fieldPath: string, items: Array<Record<string, unknown>>, index: number) {
  if (!canvas?.onUpdateField) return;
  const updated = [...items];
  updated[index] = { ...updated[index], _hidden: true };
  canvas.onUpdateField(canvas.sectionId, fieldPath, updated);
}

/** Wrapper for item cards with controls */
function ItemCardWrapper({ children, canvas, fieldPath, items, index, className }: {
  children: React.ReactNode; canvas?: CanvasCallbacks; fieldPath: string;
  items: Array<Record<string, unknown>>; index: number; className?: string;
}) {
  if (!canvas?.onUpdateField) return <>{children}</>;
  return (
    <div className={`relative group/item ${className || ""}`}>
      <CanvasItemControls
        onHide={() => hideItemAtIndex(canvas, fieldPath, items, index)}
        onDelete={() => removeItemAtIndex(canvas, fieldPath, items, index)}
      />
      {children}
    </div>
  );
}

// ─── Inline-editable text helper ───
function EditableText({
  value, field, placeholder, className, tag, canvas,
}: {
  value: string; field: string; placeholder?: string; className?: string;
  tag?: "h1" | "h3" | "p" | "span"; canvas?: CanvasCallbacks;
}) {
  if (canvas?.onUpdateField) {
    return (
      <CanvasEditableText
        value={value}
        placeholder={placeholder}
        className={className}
        tag={tag}
        onSave={(v) => canvas.onUpdateField!(canvas.sectionId, field, v)}
      />
    );
  }
  const Tag = tag || "p";
  return <Tag className={className}>{value || placeholder}</Tag>;
}

// ─── Inline-editable image helper ───
function EditableImage({
  src, alt, className, field, canvas,
}: {
  src: string; alt?: string; className?: string; field: string; canvas?: CanvasCallbacks;
}) {
  if (canvas?.onImageReplace) {
    return (
      <CanvasImagePopover
        src={src}
        alt={alt}
        className={className}
        onReplace={(url, source) => canvas.onImageReplace!(canvas.sectionId, field, url, source)}
      />
    );
  }
  if (!src) {
    return <div className={`${className || ""} bg-muted flex items-center justify-center text-muted-foreground text-xs`}>No image</div>;
  }
  return <img src={src} alt={alt || "Image"} className={`${className || ""} w-full h-full object-cover`} />;
}

// ─── Section Renderers ───

function HeroPreview({ schema, canvas, sections, onSelectSection }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks; sections?: EditorSection[]; onSelectSection?: (id: string) => void }) {
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

  // ─── Link-Bio Hero Variants ───
  const isLinkBioProfile = layoutVariant === "link_bio_profile";
  const isLinkBioMediaHero = layoutVariant === "link_bio_media_hero";
  const isLinkBioSplit = layoutVariant === "link_bio_split";
  const isLinkBioMinimal = layoutVariant === "link_bio_minimal";
  const isLinkBio = isLinkBioProfile || isLinkBioMediaHero || isLinkBioSplit || isLinkBioMinimal;

  const avatarEnabled = schema.avatar_enabled !== false;
  const socialRowEnabled = schema.social_row_enabled !== false;
  const searchEnabled = schema.search_enabled !== false;

  // Resolve social icon images from the social section's active_social_links
  const socialSection = sections?.find(s => s.section_type === "social");
  const socialSchema = socialSection?.schema as Record<string, unknown> | undefined;
  const activeSlots = (socialSchema?.active_social_links as SocialSlot[]) || [];
  const iconStyleMode = (socialSchema?.icon_style as string) || "original";

  const socialIconImages: { key: string; src: string; url: string }[] = (() => {
    if (activeSlots.length === 6) {
      return activeSlots.map(s => {
        const p = getPlatform(s.platform);
        return { key: s.platform, src: p?.icon || "", url: s.url || "" };
      }).filter(x => x.src);
    }
    // Fallback to defaults
    return DEFAULT_PRIMARY_IDS.map(id => {
      const p = getPlatform(id);
      return { key: id, src: p?.icon || "", url: "" };
    }).filter(x => x.src);
  })();

  // White/Black: apply filter to glyph but ensure container bg keeps icon recognizable
  const iconStyleClass = iconStyleMode === "white"
    ? "brightness-0 invert drop-shadow-[0_0_1px_rgba(0,0,0,0.3)]"
    : iconStyleMode === "black"
      ? "brightness-0 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]"
      : "";

  const handleSocialIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sections && onSelectSection && socialSection) {
      onSelectSection(socialSection.id);
    }
  };

  if (isLinkBio) {
    const headline = (schema.headline as string) || "";
    const subheadline = (schema.subheadline as string) || "";

    // Media hero: full-bleed image with name overlaid at bottom
    if (isLinkBioMediaHero) {
      return (
        <div className="relative overflow-hidden" style={{ backgroundColor: bgColor || "hsl(220 15% 12%)" }}>
          <div className="aspect-[4/5] relative overflow-hidden">
            <EditableImage src={resolvedMediaUrl} alt="Creator" className="w-full h-full object-cover" field="media.url" canvas={canvas} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {headline && <EditableText value={headline} field="headline" className="text-2xl font-bold" tag="h1" canvas={canvas} />}
              {subheadline && <EditableText value={subheadline} field="subheadline" className="text-sm opacity-80 mt-1" tag="p" canvas={canvas} />}
              {socialRowEnabled && (
                <div className="flex gap-3 mt-3">
                  {socialIconImages.map(({ key, src, url }) => (
                    <a key={key} href={url && url.startsWith("http") ? url : url ? `https://${url}` : "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!url) { e.preventDefault(); handleSocialIconClick(e); } }} className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center yangu-interactive hover:scale-110 transition-transform cursor-pointer">
                      <img src={src} alt={key} className={`w-full h-full object-cover ${iconStyleClass}`} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          {searchEnabled && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 yangu-search-row">
                <span className="text-white/50 text-sm">🔍</span>
                <span className="flex-1 text-sm text-white/40">Search or type a keyword</span>
                <span className="w-8 h-8 rounded-lg bg-foreground/80 text-background flex items-center justify-center text-sm yangu-interactive">→</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Profile centered: avatar + name + bio + social icons
    if (isLinkBioProfile || isLinkBioMinimal) {
      const isThemed = bgStyle === "themed";
      return (
        <div className={`py-8 px-6 text-center ${isThemed ? "bg-gradient-to-b from-accent/15 to-transparent" : ""}`} style={bgColor ? { backgroundColor: bgColor } : undefined}>
          {headline && <EditableText value={headline} field="headline" className="text-xl font-bold text-foreground" tag="h1" canvas={canvas} />}
          {subheadline && <EditableText value={subheadline} field="subheadline" className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto" tag="p" canvas={canvas} />}
          {description && <EditableText value={description} field="description" className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed" tag="p" canvas={canvas} />}
          {socialRowEnabled && (
            <div className="flex justify-center gap-3 mt-4">
              {socialIconImages.map(({ key, src, url }) => (
                <a key={key} href={url && url.startsWith("http") ? url : url ? `https://${url}` : "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!url) { e.preventDefault(); handleSocialIconClick(e); } }} className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center yangu-interactive hover:scale-110 hover:shadow-md transition-all cursor-pointer">
                  <img src={src} alt={key} className={`w-full h-full object-cover ${iconStyleClass}`} />
                </a>
              ))}
            </div>
          )}
          {avatarEnabled && resolvedMediaUrl && (
            <div className="mt-5 mx-auto w-full max-w-sm rounded-xl overflow-hidden border border-border shadow-sm">
              <EditableImage src={resolvedMediaUrl} alt="Creator" className="w-full aspect-[4/5] object-cover" field="media.url" canvas={canvas} />
            </div>
          )}
          {searchEnabled && (
            <div className="mt-5 mx-auto max-w-sm">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 yangu-search-row">
                <span className="text-muted-foreground text-sm">🔍</span>
                <span className="flex-1 text-sm text-muted-foreground/60 text-left">Search or type a keyword</span>
                <span className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-sm yangu-interactive">→</span>
              </div>
            </div>
          )}
          {ctaText && (
            <div className="mt-4">
              <EditableText value={ctaText} field="cta_text" className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium yangu-cta" tag="span" canvas={canvas} />
            </div>
          )}
        </div>
      );
    }

    // Split layout
    if (isLinkBioSplit) {
      return (
        <div className="flex items-stretch overflow-hidden" style={bgColor ? { backgroundColor: bgColor } : undefined}>
          <div className="w-2/5 bg-muted overflow-hidden">
            <EditableImage src={resolvedMediaUrl} alt="Creator" className="w-full h-full object-cover" field="media.url" canvas={canvas} />
          </div>
          <div className="flex-1 py-6 px-5 flex flex-col justify-center">
            {headline && <EditableText value={headline} field="headline" className="text-lg font-bold text-foreground" tag="h1" canvas={canvas} />}
            {subheadline && <EditableText value={subheadline} field="subheadline" className="text-xs text-muted-foreground mt-1" tag="p" canvas={canvas} />}
            {socialRowEnabled && (
              <div className="flex gap-2 mt-3">
                {socialIconImages.slice(0, 4).map(({ key, src, url }) => (
                  <a key={key} href={url && url.startsWith("http") ? url : url ? `https://${url}` : "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!url) { e.preventDefault(); handleSocialIconClick(e); } }} className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center yangu-interactive hover:scale-110 transition-transform cursor-pointer">
                    <img src={src} alt={key} className={`w-full h-full object-cover ${iconStyleClass}`} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  if (isSplit) {
    return (
      <div className="flex items-stretch overflow-hidden rounded-lg" style={{ backgroundColor: bgColor || "hsl(var(--accent) / 0.1)" }}>
        <div className="flex-1 py-8 px-6 flex flex-col justify-center">
          {schema.subheadline && !isEditorialLarge && (
            <EditableText value={schema.subheadline as string} field="subheadline" className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1" tag="p" canvas={canvas} />
          )}
          <EditableText value={(schema.headline as string) || ""} field="headline" placeholder="Your Headline" className={`font-bold text-foreground ${isEditorialLarge ? "text-xl leading-tight" : "text-lg"}`} tag="h1" canvas={canvas} />
          {isEditorialLarge && schema.subheadline && (
            <EditableText value={schema.subheadline as string} field="subheadline" className="text-xs text-muted-foreground mt-1" tag="p" canvas={canvas} />
          )}
          {description && <EditableText value={description} field="description" className="text-[11px] text-muted-foreground mt-2 leading-relaxed" tag="p" canvas={canvas} />}
          {ctaText && (
            <div className="mt-3">
              <EditableText value={ctaText} field="cta_text" className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium yangu-cta" tag="span" canvas={canvas} />
            </div>
          )}
        </div>
        <div className="w-2/5 bg-muted overflow-hidden">
          <EditableImage src={resolvedMediaUrl} alt="Hero visual" className="w-full h-full object-cover" field="media.url" canvas={canvas} />
        </div>
      </div>
    );
  }

  if (isDark || layoutVariant === "fullwidth_center") {
    return (
      <div className="py-12 px-6 text-center rounded-lg relative overflow-hidden" style={{ backgroundColor: bgColor || "hsl(0 0% 8%)" }}>
        {mediaType !== "video" && resolvedMediaUrl && (
          <EditableImage src={resolvedMediaUrl} alt="Hero visual" className="absolute inset-0 w-full h-full object-cover opacity-40" field="media.url" canvas={canvas} />
        )}
        <div className="relative z-10 max-w-2xl mx-auto">
          <EditableText value={(schema.headline as string) || ""} field="headline" placeholder="Your Headline" className={`font-bold text-white ${isBoldUppercase ? "text-2xl tracking-[0.15em] uppercase" : "text-2xl"}`} tag="h1" canvas={canvas} />
          {schema.subheadline && (
            <EditableText value={schema.subheadline as string} field="subheadline" className="mt-3 text-white/70 text-[10px] leading-relaxed max-w-[480px] mx-auto" tag="p" canvas={canvas} />
          )}
          {ctaText && (
            <div className="mt-4">
              <EditableText value={ctaText} field="cta_text" className="inline-block px-5 py-2 rounded-full bg-white text-black text-xs font-medium yangu-cta" tag="span" canvas={canvas} />
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
          <EditableImage src={resolvedMediaUrl} alt="Hero visual" className={`w-full h-full ${mediaFit === "cover" ? "object-cover" : "object-contain"}`} field="media.url" canvas={canvas} />
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
      <EditableText value={(schema.headline as string) || ""} field="headline" placeholder="Your Headline" className="text-2xl font-bold text-foreground" tag="h1" canvas={canvas} />
      {schema.subheadline && <EditableText value={schema.subheadline as string} field="subheadline" className="mt-2 text-muted-foreground" tag="p" canvas={canvas} />}
      {description && <EditableText value={description} field="description" className="mt-2 text-xs text-muted-foreground" tag="p" canvas={canvas} />}
      {ctaText && (
        <div className="mt-4">
          <a href={ctaHref || "#"} className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium yangu-cta">{ctaText}</a>
        </div>
      )}
    </div>
  );
}

function BioPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  return (
    <div className="py-6 px-6">
      <EditableText value={(schema.text as string) || ""} field="text" placeholder="Your bio goes here..." className="text-sm text-muted-foreground" tag="p" canvas={canvas} />
    </div>
  );
}

function LinksPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ label?: string; url?: string }>;
  const displayMode = (schema.display_mode as string) || "";
  const isLinkBio = displayMode === "link_buttons";

  return (
    <div className="py-4 px-6 space-y-2">
      {!isLinkBio && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links</p>}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No links added yet</p>
      ) : (
        items.map((item, i) => {
          const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
          return (
            <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
              <div
                className={`block p-3 border text-sm text-center yangu-interactive font-medium transition-all ${
                  isLinkBio
                    ? "rounded-xl border-foreground/20 bg-card hover:bg-accent/10 hover:scale-[1.02] shadow-sm"
                    : "rounded-lg border-border bg-muted/50"
                }`}
                tabIndex={0}
              >
                {item.label || item.url || "Link"}
              </div>
            </ItemCardWrapper>
          );
        })
      )}
    </div>
  );
}

function SocialPreview({ schema }: { schema: Record<string, unknown> }) {
  const activeSlots = (schema.active_social_links as SocialSlot[]) || [];
  const iconStyle = (schema.icon_style as string) || "original";
  const iconStyleClass = iconStyle === "white"
    ? "brightness-0 invert drop-shadow-[0_0_1px_rgba(0,0,0,0.3)]"
    : iconStyle === "black"
      ? "brightness-0 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]"
      : "";

  // Fallback: if no active_social_links, use legacy social_links
  const legacySocialLinks = (schema.social_links as Record<string, string>) || {};
  const disabledLinks = (schema.disabled_links as string[]) || [];

  const displaySlots: { platform: string; url: string; icon: string }[] = (() => {
    if (activeSlots.length > 0) {
      return activeSlots.map(s => {
        const p = getPlatform(s.platform);
        return { platform: s.platform, url: s.url, icon: p?.icon || "" };
      }).filter(x => x.icon);
    }
    // Legacy fallback
    const entries = Object.entries(legacySocialLinks).filter(([k, v]) => v && !disabledLinks.includes(k));
    return entries.map(([platform, url]) => {
      const p = getPlatform(platform);
      return { platform, url, icon: p?.icon || "" };
    }).filter(x => x.icon);
  })();

  return (
    <div className="py-4 px-6">
      {displaySlots.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic text-center">No social links added</p>
      ) : (
        <div className="flex justify-center gap-3 flex-wrap">
          {displaySlots.map(({ platform, url, icon }) => (
            <a
              key={platform}
              href={url && url.startsWith("http") ? url : url ? `https://${url}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center yangu-interactive hover:bg-accent/10 hover:scale-110 transition-all"
              title={platform}
            >
              <img src={icon} alt={platform} className={`w-full h-full object-cover ${iconStyleClass}`} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ShowcasePreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.showcase_items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ title?: string; description?: string; image_url?: string; link_url?: string; price?: string }>;
  const displayMode = (schema.showcase_display as string) || "carousel";
  const allRawItems = rawItems; // for controls
  const heading = (schema.heading as string) || "";
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) {
    return (
      <div className="py-6 px-6 text-center">
        <p className="text-sm text-muted-foreground/60 italic">No showcase items added yet</p>
      </div>
    );
  }

  // Accordion / Product List mode
  if (displayMode === "list") {
    return (
      <div className="py-4 px-4">
        {heading && <h3 className="text-base font-semibold text-foreground mb-3 text-center">{heading}</h3>}
        <div className="rounded-xl border border-border bg-card/80 overflow-hidden divide-y divide-border">
          {items.map((item, i) => {
            const realIdx = allRawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="showcase_items" items={allRawItems} index={realIdx}>
                <ShowcaseAccordionItem item={item} index={i} canvas={canvas} />
              </ItemCardWrapper>
            );
          })}
        </div>
      </div>
    );
  }

  // Carousel mode — 2 visible, scrolls horizontally
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });

  return (
    <div className="py-4">
      {heading && <h3 className="text-base font-semibold text-foreground mb-3 text-center px-6">{heading}</h3>}
      <div className="relative group/carousel">
        {/* Left scroll arrow */}
        <button onClick={scrollLeft} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 border border-border shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity yangu-interactive">
          ‹
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {items.map((item, i) => {
            const realIdx = allRawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="showcase_items" items={allRawItems} index={realIdx} className="shrink-0" >
                <div
                  className="snap-start rounded-xl border border-border bg-card overflow-hidden yangu-interactive hover:shadow-lg transition-all group"
                  style={{ width: "calc(50% - 6px)", minWidth: "160px" }}
                  tabIndex={0}
                >
                  {item.image_url ? (
                    <div className="aspect-square bg-muted overflow-hidden relative">
                      <EditableImage src={item.image_url} alt={item.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" field={`showcase_items.${realIdx}.image_url`} canvas={canvas} />
                      {item.price && (
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded-md">{item.price}</span>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted overflow-hidden relative">
                      <EditableImage src="" alt={item.title || "Showcase"} className="w-full h-full" field={`showcase_items.${realIdx}.image_url`} canvas={canvas} />
                    </div>
                  )}
                  <div className="p-3">
                    {item.title && <p className="text-sm font-medium truncate">{item.title}</p>}
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                    {item.link_url && (
                      <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block w-full text-center py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium yangu-interactive hover:opacity-90 transition-opacity">
                        {ctaLabel((item as any).cta_action) || "Buy Now"}
                      </a>
                    )}
                  </div>
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
        {/* Right scroll arrow */}
        <button onClick={scrollRight} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-background/80 border border-border shadow flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity yangu-interactive">
          ›
        </button>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {items.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-foreground" : "bg-foreground/30"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
function ShowcaseAccordionItem({ item, index, canvas }: { item: { title?: string; description?: string; image_url?: string; link_url?: string; price?: string }; index: number; canvas?: CanvasCallbacks }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="yangu-interactive">
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
          <EditableImage src={item.image_url || ""} alt={item.title || ""} className="w-full h-full object-cover" field={`showcase_items.${index}.image_url`} canvas={canvas} />
        </div>
        <div className="flex-1 min-w-0">
          {item.title && <p className="text-sm font-semibold truncate">{item.title}</p>}
          {item.description && !open && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>}
        </div>
        <span className={`text-muted-foreground transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200">
          {item.description && <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>}
          {item.link_url && (
            <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-4 py-1.5 rounded-full border border-border text-xs font-medium yangu-interactive hover:bg-accent/10">
              View →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CtaPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  return (
    <div className="py-6 px-6 text-center">
      <EditableText value={(schema.label as string) || ""} field="label" placeholder="Contact" className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium" tag="span" canvas={canvas} />
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

function GalleryPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.length > 0
    ? rawItems.filter((it) => !it._hidden).slice(0, 6).map((item, i) => {
        if (typeof item === "string") return item;
        return (item as Record<string, string>).src || (item as Record<string, string>).image_url || demoImage(i + 1);
      })
    : Array.from({ length: 6 }, (_, i) => demoImage(i + 1));

  return (
    <div className="py-4 px-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Gallery</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {items.map((src, i) => (
          <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={i}>
            <div className="aspect-square rounded bg-muted overflow-hidden">
              <EditableImage src={typeof src === "string" ? src : ""} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" field={`items.${i}.src`} canvas={canvas} />
            </div>
          </ItemCardWrapper>
        ))}
      </div>
    </div>
  );
}

function TextPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  return (
    <div className="py-4 px-6">
      <EditableText value={(schema.heading as string) || ""} field="heading" placeholder="Text Section" className="text-sm font-semibold text-foreground mb-1" tag="h3" canvas={canvas} />
      <EditableText value={(schema.body as string) || ""} field="body" placeholder="Content goes here..." className="text-sm text-muted-foreground" tag="p" canvas={canvas} />
    </div>
  );
}

function OfferPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ title?: string; price?: string; description?: string; icon?: string }>;
  const displayMode = (schema.display_mode as string) || (schema.layout_variant as string) || "";
  const storyBlock = schema.story_block as { enabled?: boolean; eyebrow?: string; heading?: string; description?: string; cta_text?: string } | undefined;
  const socialGallery = schema.social_gallery as { enabled?: boolean; platform?: string; heading?: string; subheading?: string; hashtag?: string; columns?: number; items?: Array<{ image_url?: string }> } | undefined;
  const newsletter = schema.newsletter as { enabled?: boolean; heading?: string; description?: string; cta_text?: string } | undefined;
  const testimonials = schema.testimonials as { enabled?: boolean; heading?: string; subheading?: string; items?: Array<{ name?: string; quote?: string; location?: string; label?: string }> } | undefined;
  const isTrustBadges = displayMode === "trust_badges";
  const isStoryBlock = displayMode === "story_block";
  const socialGalleryCount = Math.min(socialGallery?.columns || 4, 5);

  return (
    <div className="py-4 px-6 space-y-5">
      <div>
        <EditableText value={(schema.heading as string) || ""} field="heading" placeholder="What We Offer" className="text-sm font-semibold text-foreground mb-1" tag="h3" canvas={canvas} />
        {schema.description && <EditableText value={schema.description as string} field="description" className="text-xs text-muted-foreground leading-relaxed" tag="p" canvas={canvas} />}
      </div>

      {isTrustBadges && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {items.map((item, i) => (
            <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={rawItems.indexOf(item as unknown as Record<string, unknown>)}>
              <div className="p-3 sm:p-4 rounded-lg border border-border bg-muted/30 text-center yangu-card" tabIndex={0}>
                <div className="text-lg mb-1">
                  {item.icon === "truck" ? "🚚" : item.icon === "headphones" ? "🎧" : item.icon === "credit-card" ? "💳" : item.icon === "map-pin" ? "📍" : "✨"}
                </div>
                <p className="text-[11px] font-medium">{item.title || "Feature"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.description || ""}</p>
              </div>
            </ItemCardWrapper>
          ))}
        </div>
      )}

      {isStoryBlock && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, i) => (
            <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={rawItems.indexOf(item as unknown as Record<string, unknown>)}>
              <div className="flex gap-3 items-start">
                <div className="w-1/3 aspect-square rounded-lg bg-muted flex items-center justify-center text-xl">🖼</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">{item.title || "Story"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.description || ""}</p>
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          {schema.cta_text && (
            <span className="inline-block px-4 py-1.5 rounded-full border border-border text-xs font-medium">{schema.cta_text as string}</span>
          )}
        </div>
      )}

      {!isTrustBadges && !isStoryBlock && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{item.title || "Offer"}</p>
                    {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}

      {items.length === 0 && !storyBlock?.enabled && !socialGallery?.enabled && !newsletter?.enabled && !testimonials?.enabled && (
        <p className="text-sm text-muted-foreground/60 italic">No offers added</p>
      )}

      {storyBlock?.enabled && (
        <div className="border-t border-border pt-4">
          {storyBlock.eyebrow && <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{storyBlock.eyebrow}</p>}
          <p className="text-xs font-medium leading-relaxed">{storyBlock.heading || ""}</p>
          {storyBlock.description && <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{storyBlock.description}</p>}
          {storyBlock.cta_text && <span className="inline-block mt-2 px-4 py-1.5 rounded-full border border-border text-[10px] font-medium">{storyBlock.cta_text}</span>}
        </div>
      )}

      {testimonials?.enabled && (testimonials.items || []).length > 0 && (() => {
        const rawTestimonialItems = ((schema.testimonials as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || [];
        const visibleTestimonials = rawTestimonialItems.filter((it) => !it._hidden) as Array<{ name?: string; quote?: string; location?: string; label?: string }>;
        return (
          <div className="border-t border-border pt-4">
            {testimonials.subheading && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{testimonials.subheading}</p>}
            <h4 className="text-xs font-semibold mb-2">{testimonials.heading || "Reviews"}</h4>
            <div className="space-y-2">
              {visibleTestimonials.map((t, i) => {
                const realIdx = rawTestimonialItems.indexOf(t as unknown as Record<string, unknown>);
                return (
                  <ItemCardWrapper key={i} canvas={canvas} fieldPath="testimonials.items" items={rawTestimonialItems} index={realIdx}>
                    <div className="p-3 rounded-lg border border-border bg-muted/30 yangu-card" tabIndex={0}>
                      {t.label && <span className="text-[10px] font-medium text-primary">{t.label}</span>}
                      <p className="text-[11px] italic text-muted-foreground mt-1">"{t.quote || "..."}"</p>
                      <p className="text-[10px] font-medium mt-1">— {t.name || "Customer"}{t.location ? `, ${t.location}` : ""}</p>
                    </div>
                  </ItemCardWrapper>
                );
              })}
            </div>
          </div>
        );
      })()}

      {socialGallery?.enabled && (() => {
        const rawSocialItems = ((schema.social_gallery as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || [];
        return (
          <div className="border-t border-border pt-4">
            {socialGallery.subheading && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{socialGallery.subheading}</p>}
            {socialGallery.heading && <h4 className="text-xs font-semibold mb-2">{socialGallery.heading}</h4>}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${socialGalleryCount}, 1fr)` }}>
              {Array.from({ length: socialGalleryCount }).map((_, i) => (
                <ItemCardWrapper key={i} canvas={canvas} fieldPath="social_gallery.items" items={rawSocialItems} index={i}>
                  <div className="aspect-square rounded bg-muted overflow-hidden">
                    <EditableImage
                      src={socialGallery.items?.[i]?.image_url || ""}
                      alt={`Social gallery ${i + 1}`}
                      className="w-full h-full object-cover"
                      field={`social_gallery.items.${i}.image_url`}
                      canvas={canvas}
                    />
                  </div>
                </ItemCardWrapper>
              ))}
            </div>
            {socialGallery.hashtag && <p className="text-[10px] text-muted-foreground mt-1 text-center">{socialGallery.hashtag}</p>}
          </div>
        );
      })()}

      {newsletter?.enabled && (
        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-semibold">{newsletter.heading || "Subscribe"}</h4>
          {newsletter.description && <p className="text-[10px] text-muted-foreground mt-1">{newsletter.description}</p>}
          <div className="flex gap-1.5 mt-2 yangu-search-row">
            <div className="flex-1 h-8 rounded border border-border bg-background px-2 flex items-center yangu-search-input">
              <span className="text-[10px] text-muted-foreground">your@email.com</span>
            </div>
            <span className="px-3 h-8 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center yangu-interactive">{newsletter.cta_text || "Subscribe"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PlansPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ name?: string; price?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Plans"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No plans added</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 text-center yangu-card" tabIndex={0}>
                  <p className="text-sm font-medium">{item.name || "Plan"}</p>
                  {item.price && <p className="text-xs text-muted-foreground">{item.price}</p>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RulesPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ text?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Rules"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No rules defined</p>
      ) : (
        <ol className="space-y-1 list-decimal list-inside">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <li className="text-sm text-muted-foreground">{item.text || `Rule ${i + 1}`}</li>
              </ItemCardWrapper>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function JoinPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-6 px-6 text-center">
      {schema.description && <p className="text-sm text-muted-foreground mb-3">{schema.description as string}</p>}
      <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium yangu-cta">
        {(schema.label as string) || "Join Now"}
      </button>
    </div>
  );
}

function ProductsPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
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
  const usingSeedData = items.length === 0;
  const renderedItems = usingSeedData ? [
    { name: "Modern Chair", price: "$89", image_url: demoImage(0), badge: "New", description: "" },
    { name: "Stone Mug", price: "$24", image_url: demoImage(1), badge: "Hot", description: "" },
    { name: "Table Lamp", price: "$56", image_url: demoImage(2), badge: "", description: "" },
    { name: "Wall Mirror", price: "$112", image_url: demoImage(3), badge: "", description: "" },
    { name: "Linen Set", price: "$78", image_url: demoImage(4), badge: "", description: "" },
    { name: "Shelf Decor", price: "$34", image_url: demoImage(5), badge: "", description: "" },
  ] : items;
  const gridSettings = (schema.grid as { columns_desktop?: number; columns_mobile?: number; gap?: string }) || {};
  const cols = Math.min(gridSettings.columns_desktop || 2, 4);
  const cardSettings = (schema.cards as { style?: string; image_ratio?: string; show_price?: boolean; show_title?: boolean; show_cta?: boolean; card_style?: string; hover_effect?: string; badge_enabled?: boolean }) || {};
  const isSquare = cardSettings.image_ratio === "square";
  const isPortrait = cardSettings.image_ratio === "portrait";
  const showCta = cardSettings.show_cta !== false;

  return (
    <div className="py-4 px-6">
      {schema.heading && (
        <EditableText value={schema.heading as string} field="heading" className="text-sm font-semibold text-foreground mb-1" tag="h3" canvas={canvas} />
      )}
      {schema.description && (
        <EditableText value={schema.description as string} field="description" className="text-[10px] text-muted-foreground mb-3 leading-relaxed" tag="p" canvas={canvas} />
      )}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4" style={cols !== 2 && cols !== 3 && cols !== 4 ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
        {renderedItems.map((item, i) => {
          const rawProducts = (schema.products as Array<Record<string, unknown>>) || [];
          return (
            <ItemCardWrapper key={i} canvas={!usingSeedData ? canvas : undefined} fieldPath="products" items={rawProducts} index={i}>
              <div className="rounded-lg border border-border bg-card overflow-hidden group max-w-sm yangu-card" tabIndex={0}>
                <div className={`bg-muted relative ${isPortrait ? "aspect-[3/4]" : isSquare ? "aspect-square" : "aspect-[4/3]"}`}>
                  <EditableImage src={usingSeedData ? item.image_url || demoImage(i) : item.image_url || ""} alt={item.name || "Product"} className="w-full h-full object-cover" field={`products.${i}.image`} canvas={canvas} />
                  {item.badge && cardSettings.badge_enabled !== false && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary text-primary-foreground">{item.badge}</span>
                  )}
                </div>
                <div className="p-3 lg:p-4">
                  <p className="text-[11px] font-medium truncate">{item.name || "Product"}</p>
                  {item.price && <p className="text-[10px] text-primary font-semibold mt-0.5">{item.price}</p>}
                  {showCta && <span className="mt-2 inline-block text-center text-[9px] font-medium py-1.5 px-4 rounded border border-border text-muted-foreground w-fit yangu-cta">Add to Cart</span>}
                </div>
              </div>
            </ItemCardWrapper>
          );
        })}
      </div>
    </div>
  );
}

function CategoriesPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const items = (schema.items as Array<{ name?: string; icon?: string; image_url?: string; media?: Array<{ src?: string }> }>) || [];
  const usingSeedData = items.length === 0;
  const renderedItems = usingSeedData
    ? ["Living", "Kitchen", "Office", "Wellness", "Outdoor", "Decor"].map((name, i) => ({ name, image_url: demoImage(i + 2) }))
    : items;

  return (
    <div className="py-4 px-6">
      <EditableText value={(schema.heading as string) || ""} field="heading" placeholder="Categories" className="text-sm font-semibold text-foreground mb-2" tag="h3" canvas={canvas} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {renderedItems.slice(0, 9).map((item, i) => {
          const src = usingSeedData ? item.image_url || item.media?.[0]?.src || demoImage(i + 2) : item.image_url || item.media?.[0]?.src || "";
          return (
            <div key={i} className="rounded-lg overflow-hidden border border-border bg-card max-w-xs yangu-card" tabIndex={0}>
              <div className="aspect-square bg-muted">
                <EditableImage src={src} alt={item.name || "Category"} className="w-full h-full object-cover" field={`items.${i}.image_url`} canvas={canvas} />
              </div>
              <p className="text-[10px] font-medium p-1.5 text-center truncate">{item.name || "Category"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListingsPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ title?: string; name?: string; price?: string; description?: string; cta_action?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Listings"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No listings added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const cta = ctaLabel(item.cta_action);
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{item.title || item.name || "Listing"}</p>
                    {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {cta && <span className="mt-2 inline-block text-center text-[9px] font-medium py-1 px-3 rounded border border-border text-muted-foreground yangu-cta">{cta}</span>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FiltersPreview({ schema }: { schema: Record<string, unknown> }) {
  const keys = (schema.keys as string[]) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Filters"}</h3>
      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No filters configured</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keys.map((k, i) => <span key={i} className="px-3 py-1 rounded-full border border-border text-xs">{k}</span>)}
        </div>
      )}
    </div>
  );
}

function ServicesPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ name?: string; price?: string; description?: string; icon?: string; cta_action?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Services"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No services added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const cta = ctaLabel(item.cta_action);
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{item.icon && <span className="mr-1.5">{item.icon}</span>}{item.name || "Service"}</p>
                    {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {cta && <span className="mt-2 inline-block text-center text-[9px] font-medium py-1 px-3 rounded border border-border text-muted-foreground yangu-cta">{cta}</span>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeaturedPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ title?: string; description?: string; image_url?: string; href?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.title as string) || "Featured"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No featured items</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <div className="aspect-video rounded overflow-hidden mb-2 bg-muted">
                    <EditableImage src={item.image_url || ""} alt={item.title || ""} className="w-full h-full object-cover" field={`items.${realIdx}.image_url`} canvas={canvas} />
                  </div>
                  <p className="text-sm font-medium">{item.title || "Item"}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  {item.href && <p className="text-xs text-primary mt-1 truncate">{item.href}</p>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TestimonialsPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ name?: string; quote?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Testimonials"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No testimonials added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <p className="text-sm italic text-muted-foreground">"{item.quote || "..."}"</p>
                  <p className="text-xs font-medium mt-1">— {item.name || "Anonymous"}</p>
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FaqPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ question?: string; answer?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "FAQ"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No FAQ items added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="p-3 rounded-lg border border-border bg-muted/50 yangu-card" tabIndex={0}>
                  <p className="text-sm font-medium">{item.question || "Question?"}</p>
                  {item.answer && <p className="text-xs text-muted-foreground mt-1">{item.answer}</p>}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  return (
    <div className="py-4 px-6">
      <EditableText value={(schema.heading as string) || ""} field="heading" placeholder="Contact" className="text-sm font-semibold text-foreground mb-2" tag="h3" canvas={canvas} />
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>✉️ {(schema.email as string) || "hello@yourstore.com"}</p>
        <p>📞 {(schema.phone as string) || "+1 (000) 000-0000"}</p>
        <p>📍 {(schema.address as string) || "123 Your Street, City"}</p>
      </div>
    </div>
  );
}

function SchedulePreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ time?: string; title?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Schedule"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No schedule items</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="flex gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">{item.time || "TBD"}</span>
                  <span>{item.title || "Event"}</span>
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenuPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawCategories = (schema.categories as Array<Record<string, unknown>>) || [];
  const categories = rawCategories.filter((it) => !it._hidden) as Array<{ name?: string; items?: Array<{ name?: string; price?: string }> }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Menu"}</h3>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No menu items added</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, i) => {
            const realIdx = rawCategories.indexOf(cat as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="categories" items={rawCategories} index={realIdx}>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cat.name || "Category"}</p>
                  {(cat.items || []).map((item, j) => (
                    <div key={j} className="flex justify-between text-sm py-0.5">
                      <span>{item.name || "Item"}</span>
                      {item.price && <span className="text-muted-foreground">{item.price}</span>}
                    </div>
                  ))}
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HoursPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ day?: string; hours?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Opening Hours"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No hours set</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => {
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.day || "Day"}</span>
                  <span className="text-muted-foreground">{item.hours || "Closed"}</span>
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LocationPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Location"}</h3>
      <p className="text-sm text-muted-foreground">{(schema.address as string) || "No address set"}</p>
      {schema.mapUrl && (
        <div className="mt-2 aspect-video rounded-lg bg-muted flex items-center justify-center">
          <p className="text-xs text-muted-foreground">📍 Map</p>
        </div>
      )}
    </div>
  );
}

function AboutPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  return (
    <div className="py-4 px-6">
      <EditableText value={(schema.heading as string) || ""} field="heading" placeholder="About Us" className="text-sm font-semibold text-foreground mb-1" tag="h3" canvas={canvas} />
      <EditableText value={(schema.body as string) || ""} field="body" placeholder="Tell people about your community..." className="text-sm text-muted-foreground" tag="p" canvas={canvas} />
    </div>
  );
}

function CommunityFeedPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
  const rawItems = (schema.items as Array<Record<string, unknown>>) || [];
  const items = rawItems.filter((it) => !it._hidden) as Array<{ name?: string; title?: string; price?: string; description?: string; image_url?: string; media?: Array<{ src?: string }>; cta_action?: string }>;
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">{(schema.heading as string) || "Feed"}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No feed items added</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const imgSrc = item.image_url || item.media?.[0]?.src || "";
            const cta = ctaLabel(item.cta_action);
            const realIdx = rawItems.indexOf(item as unknown as Record<string, unknown>);
            return (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="items" items={rawItems} index={realIdx}>
                <div className="rounded-lg border border-border bg-muted/50 overflow-hidden yangu-card" tabIndex={0}>
                  <div className="aspect-video bg-muted">
                    <EditableImage src={imgSrc} alt={item.name || item.title || ""} className="w-full h-full object-cover" field={`items.${realIdx}.image_url`} canvas={canvas} />
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{item.name || item.title || "Item"}</p>
                      {item.price && <p className="text-xs font-medium text-primary shrink-0 ml-2">{item.price}</p>}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    {cta && <span className="mt-2 inline-block text-center text-[9px] font-medium py-1 px-3 rounded border border-border text-muted-foreground yangu-cta">{cta}</span>}
                  </div>
                </div>
              </ItemCardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GenericPreview({ section }: { section: EditorSection }) {
  return (
    <div className="py-4 px-6">
      <p className="text-sm text-muted-foreground italic">{section.section_type} section</p>
    </div>
  );
}

// ─── Header nav-label → section-type mapping ───
const NAV_LABEL_SECTION_MAP: Record<string, string[]> = {
  products: ["products", "product_grid", "listings", "listing_grid", "showcase", "creator_showcase"],
  shop: ["products", "product_grid", "listings", "listing_grid"],
  store: ["products", "product_grid", "listings", "listing_grid"],
  catalog: ["products", "product_grid", "listings", "listing_grid", "categories", "category_grid"],
  services: ["services", "services_list", "offer", "offers"],
  menu: ["menu"],
  gallery: ["gallery", "instagram_gallery", "media_grid"],
  portfolio: ["gallery", "instagram_gallery", "media_grid", "showcase", "creator_showcase"],
  about: ["about", "text", "bio"],
  "about us": ["about", "text", "bio"],
  story: ["about", "text"],
  contact: ["contact", "contact_section", "footer"],
  "contact us": ["contact", "contact_section", "footer"],
  home: ["hero", "hero_banner"],
  testimonials: ["testimonials", "reviews"],
  reviews: ["reviews", "testimonials"],
  pricing: ["plans"],
  plans: ["plans"],
  blog: ["article_feed", "text"],
  featured: ["featured", "case_studies_grid"],
  offers: ["offer", "offers", "promo", "promo_banner"],
  categories: ["categories", "category_grid", "collections"],
};

function findSectionForNavLabel(
  label: string,
  sections: EditorSection[]
): EditorSection | undefined {
  const key = label.toLowerCase().trim();
  const candidates = NAV_LABEL_SECTION_MAP[key];
  if (!candidates) {
    // Fuzzy: try startsWith match on keys
    for (const [mapKey, types] of Object.entries(NAV_LABEL_SECTION_MAP)) {
      if (key.startsWith(mapKey) || mapKey.startsWith(key)) {
        const match = sections.find((s) => s.is_visible && types.includes(s.section_type));
        if (match) return match;
      }
    }
    return undefined;
  }
  return sections.find((s) => s.is_visible && candidates.includes(s.section_type));
}

// ─── Header preview ───
function HeaderPreview({
  schema,
  sections,
  onSelectSection,
  pages,
  onSwitchPage,
}: {
  schema: Record<string, unknown>;
  canvas?: CanvasCallbacks;
  sections?: EditorSection[];
  onSelectSection?: (id: string) => void;
  pages?: Array<{ id: string; slug: string; title: string }>;
  onSwitchPage?: (pageId: string) => void;
}) {
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
  const sizeMap: Record<string, string> = { small: "h-10 w-10", medium: "h-16 w-16", large: "h-24 w-24" };
  // logo_position takes priority over layout_variant to prevent double rendering
  const isRightLogo = logoPosition === "right";
  const isCenterLogo = !isRightLogo && (logoPosition === "center" || layoutVariant === "nav_split");

  const handleNavClick = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    // First check if this label matches a page title or slug
    if (pages && pages.length > 1 && onSwitchPage) {
      const labelLower = label.toLowerCase().trim();
      const matchedPage = pages.find(
        (p) => p.title.toLowerCase() === labelLower || p.slug.toLowerCase() === labelLower
      );
      if (matchedPage) {
        onSwitchPage(matchedPage.id);
        return;
      }
    }
    // Fallback: jump to section on current page
    if (!sections || !onSelectSection) return;
    const target = findSectionForNavLabel(label, sections);
    if (target) {
      onSelectSection(target.id);
    }
  };

  const renderNavItem = (item: string, i: number) => (
    <span
      key={i}
      onClick={(e) => handleNavClick(e, item)}
      className={`text-[10px] yangu-nav-item cursor-pointer hover:underline ${isDark ? "text-background/70" : "text-muted-foreground"}`}
    >
      {item}
    </span>
  );

  const logoBlock = (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className={`${sizeMap[logoSize] || "h-10 w-10"} object-contain rounded`} />
      ) : (
        <div className={`${sizeMap[logoSize] || "h-10 w-10"} bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground`}>Logo</div>
      )}
      {showName && <span className={`text-xs font-semibold ${isDark ? "text-background" : "text-foreground"}`}>Store</span>}
    </div>
  );

  return (
    <div className={`w-full py-2.5 px-4 flex items-center ${isDark ? "bg-foreground/90" : ""}`}>
      {/* LEFT position: logo first, then nav, then icons */}
      {!isCenterLogo && !isRightLogo && (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {logoBlock}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {navItems.length > 0 && navItems.slice(0, 3).map((item, i) => renderNavItem(item, i))}
            {showSearch && <span className="text-sm">🔍</span>}
            {showCart && <span className="text-sm">🛒</span>}
          </div>
        </>
      )}
      {/* CENTER position: left nav, logo center, right nav/icons */}
      {isCenterLogo && (
        <>
          <div className="flex gap-2 flex-1 justify-start min-w-0">
            {navItems.slice(0, 3).map((item, i) => renderNavItem(item, i))}
          </div>
          <div className="flex items-center justify-center shrink-0 px-3">
            {logoBlock}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {(schema.nav_items_right as string[] || []).slice(0, 2).map((item, i) => renderNavItem(item, i))}
            {showSearch && <span className="text-sm">🔍</span>}
            {showCart && <span className="text-sm">🛒</span>}
          </div>
        </>
      )}
      {/* RIGHT position: nav/icons grouped left, logo forced to far right */}
      {isRightLogo && (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {navItems.length > 0 && navItems.slice(0, 3).map((item, i) => renderNavItem(item, i))}
            {showSearch && <span className="text-sm">🔍</span>}
            {showCart && <span className="text-sm">🛒</span>}
          </div>
          <div className="ml-auto flex items-center justify-end shrink-0 pl-3">
            {logoBlock}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Footer preview ───
function FooterPreview({ schema, canvas }: { schema: Record<string, unknown>; canvas?: CanvasCallbacks }) {
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
      {newsletterEnabled && (
        <div className="pb-3 border-b border-border">
          <h4 className="text-xs font-semibold">{newsletterHeading || "Subscribe"}</h4>
          {newsletterDesc && <p className="text-[10px] text-muted-foreground mt-1">{newsletterDesc}</p>}
          <div className="flex gap-1.5 mt-2 yangu-search-row">
            <div className="flex-1 h-7 rounded border border-border bg-background px-2 flex items-center yangu-search-input">
              <span className="text-[10px] text-muted-foreground">your@email.com</span>
            </div>
            <span className="px-3 h-7 rounded bg-primary text-primary-foreground text-[10px] font-medium flex items-center yangu-interactive">Subscribe</span>
          </div>
        </div>
      )}
      {isMultiColumn && columns.length > 0 && (() => {
        const rawColumns = (schema.columns as Array<Record<string, unknown>>) || [];
        return (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 3)}, 1fr)` }}>
            {columns.map((col, i) => (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="columns" items={rawColumns} index={i}>
                <div>
                  <p className="text-[10px] font-semibold mb-1">{col.title || "Links"}</p>
                  {(col.links || []).map((link, j) => (
                    <p key={j} className="text-[10px] text-muted-foreground leading-relaxed">{link}</p>
                  ))}
                </div>
              </ItemCardWrapper>
            ))}
          </div>
        );
      })()}
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
      {hours.length > 0 && (() => {
        const rawHours = (schema.hours as Array<Record<string, unknown>>) || [];
        return (
          <div className="space-y-0.5">
            {hours.map((h, i) => (
              <ItemCardWrapper key={i} canvas={canvas} fieldPath="hours" items={rawHours} index={i}>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{h.day || "Day"}</span>
                  <span>{h.hours || "Closed"}</span>
                </div>
              </ItemCardWrapper>
            ))}
          </div>
        );
      })()}
      {copyright && <p className="text-[9px] text-muted-foreground/60 text-center pt-2 border-t border-border">{copyright}</p>}
    </div>
  );
}

// ─── Preview map (canvas-aware renderers get canvas prop passed separately) ───
const CANVAS_AWARE_TYPES = new Set([
  "hero", "hero_banner", "bio", "text", "about", "offer", "offers", "promo", "promo_banner",
  "trust_badges", "cta", "cta_block", "newsletter", "products", "product_grid",
  "categories", "category_grid", "collections", "gallery", "instagram_gallery", "media_grid",
  "contact", "contact_section", "footer", "showcase", "creator_showcase",
  "featured", "case_studies_grid",
  "testimonials", "faq", "services", "services_list", "listings", "listing_grid",
  "plans", "rules", "schedule", "menu", "hours", "location",
  "properties", "booking_inventory", "community_feed",
  "links", "links_grid",
]);

export const PREVIEW_MAP: Record<string, React.ComponentType<{ schema: Record<string, unknown>; canvas?: CanvasCallbacks }>> = {
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
  showcase: ShowcasePreview,
  creator_showcase: ShowcasePreview,
  community_feed: CommunityFeedPreview,
};

export function BuilderPreview({ sections, surfaceTitle, selectedSectionId, onSelectSection, theme, pageSettings, liveSchemaOverride, onUpdateSectionField, onHideSection, onDeleteSection, onImageReplace, previewViewport, pages, onSwitchPage }: BuilderPreviewProps) {
  const t = theme || DEFAULT_THEME;
  const ps = pageSettings || DEFAULT_PAGE_SETTINGS;
  const isLayoutB = ps.layout === "layout_b";

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
    ...(isDark ? {
      "--background": "240 17% 12%",
      "--foreground": resolvedForegroundToken || "210 40% 98%",
      "--card": cardToken || "240 17% 14%",
      "--muted": "240 10% 20%",
      "--border": "240 10% 30%",
    } : {}),
  } as React.CSSProperties;

  if (sections.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-lg font-semibold text-muted-foreground">No sections yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Add sections from the left panel to start building your page.</p>
      </Card>
    );
  }

  const canvasEditEnabled = !!(onUpdateSectionField || onHideSection || onDeleteSection);

  return (
    <>
      <div className={`yangu-live mx-auto border border-border rounded-xl overflow-hidden shadow-sm bg-background text-foreground transition-all ${previewViewport === "desktop" ? "max-w-2xl" : "max-w-md"}`} style={themeStyle}>
        <div className="bg-muted/50 border-b border-border px-4 py-2">
          <p className="text-xs text-muted-foreground text-center truncate">{surfaceTitle}</p>
        </div>

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

              // Build canvas callbacks for inline editing
              const canvas: CanvasCallbacks | undefined = canvasEditEnabled
                ? {
                    sectionId: section.id,
                    onUpdateField: onUpdateSectionField,
                    onImageReplace: onImageReplace,
                  }
                : undefined;

              return (
                <div
                  key={section.id}
                  data-section-id={section.id}
                  onClick={() => onSelectSection?.(section.id)}
                  style={sectionStyle}
                  className={`relative group/section cursor-pointer transition-all ${
                    isLayoutB
                      ? "rounded-lg border border-border bg-card shadow-sm"
                      : "border-b border-border last:border-b-0"
                  } ${selectedSectionId === section.id ? "ring-2 ring-primary ring-inset" : "hover:ring-1 hover:ring-primary/30 hover:ring-inset"}`}
                >
                  {canvasEditEnabled && onHideSection && onDeleteSection && (
                    <CanvasSectionControls
                      sectionId={section.id}
                      sectionType={section.section_type}
                      onHide={onHideSection}
                      onDelete={onDeleteSection}
                    />
                  )}
                  {Preview ? (
                    (section.section_type === "hero" || section.section_type === "hero_banner")
                      ? <HeroPreview schema={displaySchema} canvas={canvas} sections={sections} onSelectSection={onSelectSection} />
                      : (section.section_type === "header" || section.section_type === "header_logo")
                        ? <HeaderPreview schema={displaySchema} sections={sections} onSelectSection={onSelectSection} pages={pages} onSwitchPage={onSwitchPage} />
                        : CANVAS_AWARE_TYPES.has(section.section_type)
                          ? <Preview schema={displaySchema} canvas={canvas} />
                          : <Preview schema={displaySchema} />
                  ) : (
                    <GenericPreview section={section} />
                  )}
                </div>
              );
            })}
        </div>

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

      {canvasEditEnabled && <CanvasHints />}
    </>
  );
}
