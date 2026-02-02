import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { AppShell, PageContainer, Card, PrimaryButton, SecondaryButton } from "@/components/primitives";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Save, Globe, CheckCircle2, XCircle, Lock } from "lucide-react";
import { toast } from "sonner";

const editorSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  slug: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL must be under 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores and hyphens allowed"),
});

type EditorFormData = z.infer<typeof editorSchema>;

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

export default function SurfaceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [surface, setSurface] = useState<SurfaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Slug availability state
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const form = useForm<EditorFormData>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      title: "",
      description: "",
      slug: "",
    },
  });

  const watchedSlug = form.watch("slug");
  const debouncedSlug = useDebounce(watchedSlug, 400);

  // Check slug availability
  const checkSlugAvailability = useCallback(
    async (slug: string) => {
      if (!surface || !slug) {
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
    [surface]
  );

  // Trigger slug check when debounced value changes
  useEffect(() => {
    checkSlugAvailability(debouncedSlug);
  }, [debouncedSlug, checkSlugAvailability]);

  // Fetch surface data
  useEffect(() => {
    async function fetchSurface() {
      if (!id) {
        setError("Surface ID is required");
        setIsLoading(false);
        return;
      }

      try {
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("public_surfaces")
          .select(`
            id,
            title,
            description,
            slug,
            is_published,
            user_id,
            domain_id,
            domain:surface_domains!inner(
              id,
              domain,
              label,
              surface_type
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (surfaceError) {
          console.error("Surface fetch error:", surfaceError);
          if (surfaceError.code === "PGRST116" || surfaceError.message.includes("security")) {
            setAccessDenied(true);
            setIsLoading(false);
            return;
          }
          setError("Failed to load surface");
          setIsLoading(false);
          return;
        }

        if (!surfaceData) {
          setError("Surface not found");
          setIsLoading(false);
          return;
        }

        // Check ownership
        const currentUserId = user?.id;
        if (!currentUserId || currentUserId !== surfaceData.user_id) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        const typedSurface: SurfaceData = {
          ...surfaceData,
          domain: surfaceData.domain as SurfaceData["domain"],
        };

        setSurface(typedSurface);

        // Set form defaults
        form.reset({
          title: typedSurface.title,
          description: typedSurface.description || "",
          slug: typedSurface.slug,
        });
      } catch (err) {
        console.error("Error fetching surface:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchSurface();
    }
  }, [id, user?.id, authLoading, form]);

  const onSubmit = async (data: EditorFormData) => {
    if (!surface || !user) return;

    const normalizedSlug = data.slug.trim().toLowerCase();

    // Check if slug changed and is not available
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
        .eq("user_id", user.id);

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
      
      // Update local state
      setSurface((prev) =>
        prev
          ? {
              ...prev,
              title: data.title.trim(),
              description: data.description?.trim() || null,
              slug: normalizedSlug,
            }
          : null
      );
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to edit this surface.
          </p>
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !surface) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground mb-6">{error || "Surface not found"}</p>
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  const fullUrl = `${surface.domain.domain}/${form.watch("slug") || surface.slug}`;

  return (
    <AppShell>
      <PageContainer size="md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">Edit Surface</h1>
            </div>
            <Badge variant={surface.is_published ? "default" : "secondary"}>
              {surface.is_published ? "Published" : "Draft"}
            </Badge>
          </div>

          {/* Editor Card */}
          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
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

                {/* Description */}
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
                      <FormDescription>
                        A brief description (max 500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug with availability check */}
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
                            {checkingSlug && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {!checkingSlug && slugAvailable === true && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                            {!checkingSlug && slugAvailable === false && (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="text-xs">{fullUrl}</span>
                      </FormDescription>
                      {slugAvailable === false && (
                        <p className="text-sm text-destructive">This URL is already taken</p>
                      )}
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
                  <p className="text-xs text-muted-foreground">
                    Domain cannot be changed after creation
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
                  <SecondaryButton type="button" onClick={handleBack}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    type="submit"
                    disabled={isSaving || (slugAvailable === false)}
                  >
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
                  </PrimaryButton>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
