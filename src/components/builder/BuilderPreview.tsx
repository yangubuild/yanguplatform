import type { EditorSection } from "@/hooks/useBuilderEditor";
import { Card } from "@/components/primitives";

interface BuilderPreviewProps {
  sections: EditorSection[];
  surfaceTitle: string;
}

// Minimal preview renderers per section type
function HeroPreview({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="py-12 px-6 text-center bg-gradient-to-b from-accent/10 to-transparent rounded-lg">
      <h1 className="text-2xl font-bold text-foreground">
        {(schema.headline as string) || "Your Headline"}
      </h1>
      {schema.subheadline && (
        <p className="mt-2 text-muted-foreground">{schema.subheadline as string}</p>
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

function GenericPreview({ section }: { section: EditorSection }) {
  return (
    <div className="py-4 px-6">
      <p className="text-sm text-muted-foreground italic">
        {section.section_type} section
      </p>
    </div>
  );
}

const PREVIEW_MAP: Record<string, React.ComponentType<{ schema: Record<string, unknown> }>> = {
  hero: HeroPreview,
  bio: BioPreview,
  links: LinksPreview,
  social: SocialPreview,
  cta: CtaPreview,
  video: VideoPreview,
  gallery: GalleryPreview,
};

export function BuilderPreview({ sections, surfaceTitle }: BuilderPreviewProps) {
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
    <div className="max-w-md mx-auto border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Phone-like frame header */}
      <div className="bg-muted/50 border-b border-border px-4 py-2">
        <p className="text-xs text-muted-foreground text-center truncate">{surfaceTitle}</p>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border">
        {sections
          .filter((s) => s.is_visible)
          .map((section) => {
            const Preview = PREVIEW_MAP[section.section_type];
            return (
              <div key={section.id}>
                {Preview ? (
                  <Preview schema={section.schema} />
                ) : (
                  <GenericPreview section={section} />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
