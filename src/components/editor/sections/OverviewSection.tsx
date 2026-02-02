import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/primitives";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Globe, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const overviewSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  slug: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL must be under 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores and hyphens allowed"),
});

type OverviewFormData = z.infer<typeof overviewSchema>;

interface SurfaceData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  user_id: string;
  domain_id: string;
  domain: {
    id: string;
    domain: string;
    label: string;
    surface_type: string;
  };
}

interface OverviewSectionProps {
  surface: SurfaceData;
  userId: string;
  onSurfaceUpdate: (updates: Partial<SurfaceData>) => void;
}

export function OverviewSection({ surface, userId, onSurfaceUpdate }: OverviewSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const form = useForm<OverviewFormData>({
    resolver: zodResolver(overviewSchema),
    defaultValues: {
      title: surface.title,
      description: surface.description || "",
      slug: surface.slug,
    },
  });

  const watchedSlug = form.watch("slug");
  const debouncedSlug = useDebounce(watchedSlug, 400);

  const checkSlugAvailability = useCallback(
    async (slug: string) => {
      if (!slug) {
        setSlugAvailable(null);
        return;
      }

      const normalizedSlug = slug.trim().toLowerCase();

      // If slug hasn't changed from original, it's available
      if (normalizedSlug === surface.slug) {
        setSlugAvailable(true);
        return;
      }

      // Validate format first
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(normalizedSlug)) {
        setSlugAvailable(null);
        return;
      }

      setCheckingSlug(true);
      try {
        const { data, error } = await supabase.rpc("is_slug_available", {
          _domain_id: surface.domain_id,
          _slug: normalizedSlug,
        });

        if (error) {
          console.error("Slug check error:", error);
          setSlugAvailable(null);
        } else {
          setSlugAvailable(data === true);
        }
      } catch (err) {
        console.error("Slug availability check failed:", err);
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    },
    [surface.slug, surface.domain_id]
  );

  useEffect(() => {
    checkSlugAvailability(debouncedSlug);
  }, [debouncedSlug, checkSlugAvailability]);

  const onSubmit = async (data: OverviewFormData) => {
    const normalizedSlug = data.slug.trim().toLowerCase();

    if (normalizedSlug !== surface.slug && slugAvailable === false) {
      toast.error("This URL is already taken. Please choose a different one.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("public_surfaces")
        .update({
          title: data.title.trim(),
          description: data.description?.trim() || null,
          slug: normalizedSlug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", surface.id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Update error:", updateError);
        if (updateError.code === "23505") {
          toast.error("This URL is already taken. Please choose a different one.");
        } else {
          toast.error("Failed to save changes. Please try again.");
        }
        return;
      }

      toast.success("Surface updated successfully!");
      onSurfaceUpdate({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        slug: normalizedSlug,
      });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const fullUrl = `${surface.domain.domain}/${form.watch("slug") || surface.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">Manage your surface's basic information</p>
      </div>

      {/* Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{surface.is_published ? "Published" : "Draft"}</p>
          </div>
          <Badge variant={surface.is_published ? "default" : "secondary"}>
            {surface.is_published ? "Live" : "Draft"}
          </Badge>
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Surface" {...field} />
                  </FormControl>
                  <FormDescription>The name of your surface</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell visitors what your surface is about..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A brief description (max 500 characters)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="my-surface"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setSlugAvailable(null);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingSlug && slugAvailable === true && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {!checkingSlug && slugAvailable === false && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-xs">{fullUrl}</span>
                  </FormDescription>
                  {slugAvailable === false && <p className="text-sm text-destructive">This URL is already taken</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Domain (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <div className="flex items-center gap-2 p-3 rounded-md border border-input bg-muted/50">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{surface.domain.domain}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {surface.domain.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Domain cannot be changed after creation</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={isSaving || slugAvailable === false}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
