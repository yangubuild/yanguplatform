import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useBuilderSurfaceSettings } from "@/hooks/useBuilderSurfaceSettings";

export interface BuilderTheme {
  font_family: string;
  heading_weight: string;
  body_weight: string;
  accent_style: string;
}

export const DEFAULT_THEME: BuilderTheme = {
  font_family: "Lufga",
  heading_weight: "600",
  body_weight: "400",
  accent_style: "default",
};

export function getThemeFromMetadata(metadata: Record<string, unknown> | undefined): BuilderTheme {
  const raw = (metadata as any)?.theme as Partial<BuilderTheme> | undefined;
  return { ...DEFAULT_THEME, ...(raw || {}) };
}

interface BuilderSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceId: string;
  surface: {
    title: string;
    description?: string | null;
    slug: string;
    metadata?: Record<string, unknown>;
  };
  onSaved?: (updated: Record<string, unknown>) => void;
}

const FONT_OPTIONS = ["Lufga", "Inter", "DM Sans", "Space Grotesk", "Outfit"];
const WEIGHT_OPTIONS = ["400", "500", "600", "700"];

export function BuilderSettingsDrawer({
  open,
  onOpenChange,
  surfaceId,
  surface,
  onSaved,
}: BuilderSettingsDrawerProps) {
  const { save, isSaving } = useBuilderSurfaceSettings(surfaceId);

  const [title, setTitle] = useState(surface.title);
  const [description, setDescription] = useState(surface.description || "");
  const [slug, setSlug] = useState(surface.slug);
  const [listOnCommunity, setListOnCommunity] = useState(
    !!(surface.metadata as any)?.list_on_community
  );
  const [featuredTier, setFeaturedTier] = useState<string>(
    ((surface.metadata as any)?.featured_tier as string) || "none"
  );

  // Theme state
  const [theme, setTheme] = useState<BuilderTheme>(() => getThemeFromMetadata(surface.metadata));

  // Sync when surface prop changes
  useEffect(() => {
    setTitle(surface.title);
    setDescription(surface.description || "");
    setSlug(surface.slug);
    setListOnCommunity(!!(surface.metadata as any)?.list_on_community);
    setFeaturedTier(
      ((surface.metadata as any)?.featured_tier as string) || "none"
    );
    setTheme(getThemeFromMetadata(surface.metadata));
  }, [surface]);

  const updateTheme = (partial: Partial<BuilderTheme>) => {
    setTheme((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    const metadata = {
      ...(surface.metadata || {}),
      list_on_community: listOnCommunity,
      featured_tier: featuredTier === "none" ? null : featuredTier,
      theme,
    };
    const result = await save({ title, description, slug, metadata });
    if (result) {
      onSaved?.(result);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Surface Settings</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="theme" className="flex-1">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="settings-title">Title</Label>
              <Input
                id="settings-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-description">Description</Label>
              <Textarea
                id="settings-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description…"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-slug">Slug</Label>
              <Input
                id="settings-slug"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                  )
                }
                placeholder="my-page"
              />
              <p className="text-xs text-muted-foreground">
                URL-safe identifier for this surface
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>List on Community</Label>
                <p className="text-xs text-muted-foreground">
                  Show this surface on the Community explore page
                </p>
              </div>
              <Switch
                checked={listOnCommunity}
                onCheckedChange={setListOnCommunity}
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Tier</Label>
              <Select value={featuredTier} onValueChange={setFeaturedTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={theme.font_family} onValueChange={(v) => updateTheme({ font_family: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Applied to all text on this surface</p>
            </div>

            <div className="space-y-2">
              <Label>Heading Weight</Label>
              <Select value={theme.heading_weight} onValueChange={(v) => updateTheme({ heading_weight: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}{w === "400" ? " (Regular)" : w === "600" ? " (Semi-bold)" : w === "700" ? " (Bold)" : " (Medium)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Body Weight</Label>
              <Select value={theme.body_weight} onValueChange={(v) => updateTheme({ body_weight: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}{w === "400" ? " (Regular)" : w === "600" ? " (Semi-bold)" : w === "700" ? " (Bold)" : " (Medium)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accent Style</Label>
              <Select value={theme.accent_style} onValueChange={(v) => updateTheme({ accent_style: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">More styles coming soon</p>
            </div>

            {/* Live preview hint */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
              <h3 style={{ fontFamily: theme.font_family, fontWeight: Number(theme.heading_weight) }} className="text-lg text-foreground">
                Heading Preview
              </h3>
              <p style={{ fontFamily: theme.font_family, fontWeight: Number(theme.body_weight) }} className="text-sm text-muted-foreground">
                Body text preview with your selected font and weight settings.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
