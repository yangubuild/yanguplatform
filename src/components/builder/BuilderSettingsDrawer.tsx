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
import { Loader2 } from "lucide-react";
import { useBuilderSurfaceSettings } from "@/hooks/useBuilderSurfaceSettings";

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

  // Sync when surface prop changes
  useEffect(() => {
    setTitle(surface.title);
    setDescription(surface.description || "");
    setSlug(surface.slug);
    setListOnCommunity(!!(surface.metadata as any)?.list_on_community);
    setFeaturedTier(
      ((surface.metadata as any)?.featured_tier as string) || "none"
    );
  }, [surface]);

  const handleSave = async () => {
    const metadata = {
      ...(surface.metadata || {}),
      list_on_community: listOnCommunity,
      featured_tier: featuredTier === "none" ? null : featuredTier,
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

        <div className="mt-6 space-y-5">
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
