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
}

// ─── Existing live_bio renderers (unchanged) ───

function isYouTubeUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

function HeroPreview({ schema }: { schema: Record<string, unknown> }) {
  const media = (schema.media as { type?: string; url?: string; fit?: string }) || {};
  const mediaType = media.type || "none";
  const mediaUrl = media.url || "";
  const mediaFit = media.fit || "contain";
  const ctaText = (schema.cta_text as string) || "";
  const ctaHref = (schema.cta_href as string) || "";

  return (
    <div className="py-12 px-6 text-center bg-gradient-to-b from-accent/10 to-transparent rounded-lg">
      {mediaType === "image" && mediaUrl && (
        <div className={`aspect-video rounded-lg mb-4 overflow-hidden ${mediaFit === "contain" ? "bg-muted" : ""}`}>
          <img
            src={mediaUrl}
            alt=""
            className={`w-full h-full ${mediaFit === "cover" ? "object-cover" : "object-contain"}`}
          />
        </div>
      )}
      {mediaType === "video" && mediaUrl && (() => {
        const ytId = isYouTubeUrl(mediaUrl);
        return ytId ? (
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video"
            />
          </div>
        ) : (
          <video src={mediaUrl} controls className="w-full rounded-lg mb-4" />
        );
      })()}
      <h1 className="text-2xl font-bold text-foreground">
        {(schema.headline as string) || "Your Headline"}
      </h1>
      {schema.subheadline && (
        <p className="mt-2 text-muted-foreground">{schema.subheadline as string}</p>
      )}
      {ctaText && (
        <div className="mt-4">
          <a
            href={ctaHref || "#"}
            className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            {ctaText}
          </a>
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
  const items = (schema.items as Array<unknown>) || [];
  return (
    <div className="py-4 px-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Gallery</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No images added</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.slice(0, 6).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-muted" />
          ))}
        </div>
      )}
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
  const items = (schema.items as Array<{ title?: string; price?: string; description?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "What We Offer"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No offers added</p>
      ) : (
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
  const items = (schema.items as Array<{ name?: string; price?: string; description?: string; image_url?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Products"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No products added</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/50 overflow-hidden">
              {item.image_url && (
                <div className="aspect-video bg-muted">
                  <img src={item.image_url} alt={item.name || ""} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium">{item.name || "Product"}</p>
                {item.price && <p className="text-xs text-primary font-medium">{item.price}</p>}
                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesPreview({ schema }: { schema: Record<string, unknown> }) {
  const items = (schema.items as Array<{ name?: string; icon?: string }>) || [];
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Categories"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">No categories added</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.name || "Category"}
            </span>
          ))}
        </div>
      )}
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
  return (
    <div className="py-4 px-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {(schema.heading as string) || "Contact"}
      </h3>
      <div className="space-y-1 text-sm text-muted-foreground">
        {schema.email && <p>✉️ {schema.email as string}</p>}
        {schema.phone && <p>📞 {schema.phone as string}</p>}
        {schema.address && <p>📍 {schema.address as string}</p>}
        {!schema.email && !schema.phone && !schema.address && (
          <p className="italic text-muted-foreground/60">No contact info added</p>
        )}
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
  const sizeMap: Record<string, string> = { small: "h-10 w-10", medium: "h-16 w-16", large: "h-24 w-24" };
  const justifyMap: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };

  return (
    <div className={`py-3 px-6 flex items-center gap-3 ${justifyMap[logoPosition] || "justify-start"}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className={`${sizeMap[logoSize] || "h-16 w-16"} object-contain rounded`} />
      ) : (
        <div className={`${sizeMap[logoSize] || "h-16 w-16"} bg-muted rounded flex items-center justify-center text-xs text-muted-foreground`}>Logo</div>
      )}
      {showName && <span className="text-sm font-semibold text-foreground">Business Name</span>}
    </div>
  );
}

// ─── Footer preview ───
function FooterPreview({ schema }: { schema: Record<string, unknown> }) {
  const social = (schema.social as Record<string, string>) || {};
  const hours = (schema.hours as Array<{ day?: string; hours?: string }>) || [];
  const socialEntries = Object.entries(social).filter(([, v]) => v);

  return (
    <div className="py-4 px-6 bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground mb-2">Footer</h3>
      <div className="space-y-1 text-sm text-muted-foreground">
        {schema.email && <p>✉️ {schema.email as string}</p>}
        {schema.phone && <p>📞 {schema.phone as string}</p>}
        {schema.address && <p>📍 {schema.address as string}</p>}
      </div>
      {socialEntries.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {socialEntries.map(([platform, handle]) => (
            <span key={platform} className="px-2 py-0.5 rounded bg-muted text-xs">
              {platform}: {handle}
            </span>
          ))}
        </div>
      )}
      {hours.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {hours.map((h, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span>{h.day || "Day"}</span>
              <span>{h.hours || "Closed"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const PREVIEW_MAP: Record<string, React.ComponentType<{ schema: Record<string, unknown> }>> = {
  hero: HeroPreview,
  header: HeaderPreview,
  bio: BioPreview,
  links: LinksPreview,
  social: SocialPreview,
  cta: CtaPreview,
  video: VideoPreview,
  gallery: GalleryPreview,
  text: TextPreview,
  about: AboutPreview,
  offer: OfferPreview,
  plans: PlansPreview,
  rules: RulesPreview,
  join: JoinPreview,
  products: ProductsPreview,
  categories: CategoriesPreview,
  listings: ListingsPreview,
  filters: FiltersPreview,
  services: ServicesPreview,
  featured: FeaturedPreview,
  testimonials: TestimonialsPreview,
  faq: FaqPreview,
  contact: ContactPreview,
  schedule: SchedulePreview,
  menu: MenuPreview,
  hours: HoursPreview,
  location: LocationPreview,
  footer: FooterPreview,
};

export function BuilderPreview({ sections, surfaceTitle, selectedSectionId, onSelectSection, theme, pageSettings }: BuilderPreviewProps) {
  const t = theme || DEFAULT_THEME;
  const ps = pageSettings || DEFAULT_PAGE_SETTINGS;
  const isLayoutB = ps.layout === "layout_b";

  // Console proof for layout switching
  useEffect(() => {
    console.log("BUILDER_LAYOUT_SWITCHED", { layout: isLayoutB ? "B" : "A", wireframeId: ps.layout });
  }, [ps.layout, isLayoutB]);

  const themeStyle: React.CSSProperties = {
    fontFamily: t.font_family,
    fontWeight: Number(t.body_weight),
    "--builder-heading-weight": t.heading_weight,
    ...(ps.background_color ? { backgroundColor: ps.background_color } : {}),
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
    <div className="max-w-md mx-auto border border-border rounded-xl overflow-hidden bg-card shadow-sm" style={themeStyle}>
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
            return (
              <div
                key={section.id}
                onClick={() => onSelectSection?.(section.id)}
                className={`cursor-pointer transition-all ${
                  isLayoutB
                    ? "rounded-lg border border-border bg-card shadow-sm"
                    : "border-b border-border last:border-b-0"
                } ${selectedSectionId === section.id ? "ring-2 ring-primary ring-inset" : "hover:bg-accent/5"}`}
              >
                {Preview ? (
                  <Preview schema={section.schema} />
                ) : (
                  <GenericPreview section={section} />
                )}
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
