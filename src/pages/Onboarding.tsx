import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { AuthShell } from "@/components/auth/AuthShell";
import { OrgSelector } from "@/components/OrgSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Loader2, Check, X, AtSign, ArrowRight, ArrowLeft, Link2,
  ShoppingBag, Package, Hotel, Users, Sparkles, Eye, Radio
} from "lucide-react";
import { PLATFORM_DOMAIN } from "@/config/platform";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/primitives/Card";
import { cn } from "@/lib/utils";

// ============================================================
// LOCKED DOMAIN MAP - DO NOT CHANGE
// ============================================================
const ONBOARDING_PATHS = {
  shop: {
    id: "shop",
    label: "Sell Products",
    description: "Fashion, restaurants, electronics, food, retail shops",
    icon: ShoppingBag,
    domain: "yangu.shop",
    surfaceType: "shop",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
  },
  store: {
    id: "store",
    label: "Sell in Bulk / Trade",
    description: "Supermarkets, hardware, bulk goods, agriculture, wholesalers",
    icon: Package,
    domain: "yangu.store",
    surfaceType: "store",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
  },
  site: {
    id: "site",
    label: "Offer Services",
    description: "Hotels, motels, tours, travel, real estate, consultancy",
    icon: Hotel,
    domain: "yangu.site",
    surfaceType: "site",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/50",
  },
  community: {
    id: "community",
    label: "Build or Join a Community",
    description: "NGOs, schools, agencies, freelancers, coaches, groups",
    icon: Users,
    domain: "yangu.community",
    surfaceType: "community",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/50",
  },
  live: {
    id: "live",
    label: "Influencer / Live Selling",
    description: "Content creators, influencers, live sellers, streamers",
    icon: Radio,
    domain: "yangu.live",
    surfaceType: "live",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/50",
  },
  studio: {
    id: "studio",
    label: "Create Ads with AI",
    description: "Generate ads, videos, images from product links",
    icon: Sparkles,
    domain: "yangu.studio",
    surfaceType: null, // Studio is NOT a surface - it's a global tool
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50",
  },
  explore: {
    id: "explore",
    label: "Just Explore",
    description: "Browse, discover, join communities",
    icon: Eye,
    domain: "yangu.io",
    surfaceType: null, // No surface created - just explore
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/50",
  },
} as const;

type OnboardingPathKey = keyof typeof ONBOARDING_PATHS;

const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  displayName: z.string().trim().max(100, "Display name too long").optional(),
});

const slugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "URL must be at least 3 characters")
    .max(30, "URL must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens allowed"),
});

type UsernameFormData = z.infer<typeof usernameSchema>;
type SlugFormData = z.infer<typeof slugSchema>;

type OnboardingStep = "username" | "goal" | "surface" | "select-org";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrg();
  
  // Check if this is a "create new surface" flow (from dashboard)
  const isCreateNewSurface = searchParams.get("new") === "1";
  
  // Step state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("username");
  const [isLoading, setIsLoading] = useState(false);
  
  // Username state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [savedUsername, setSavedUsername] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  
  // Goal/Path state - direct domain selection
  const [selectedPath, setSelectedPath] = useState<OnboardingPathKey | null>(null);
  
  // Slug state
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Selected org for surface creation (when user has multiple orgs)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: "", displayName: "" },
  });

  const slugForm = useForm<SlugFormData>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: "" },
  });

  const username = usernameForm.watch("username");
  const slug = slugForm.watch("slug");
  const debouncedUsername = useDebounce(username, 500);
  const debouncedSlug = useDebounce(slug, 500);

  // Redirect if not authenticated, or if already onboarded and not creating new surface
  useEffect(() => {
    if (!authLoading && !orgLoading) {
      if (!user) {
        console.log("[Onboarding] No user, redirecting to login");
        navigate("/auth/login");
      } else if (profile?.onboarding_completed && !isCreateNewSurface) {
        console.log("[Onboarding] Onboarding completed, redirecting to dashboard");
        navigate("/dashboard");
      } else if (isCreateNewSurface && profile?.onboarding_completed) {
        // For "create new surface", check if user has an active org
        console.log("[Onboarding] Create new surface mode");
        setSavedUsername(profile.username || "");
        setSavedDisplayName(profile.display_name || "");
        
        if (activeOrg) {
          // User has an active org, proceed to goal selection
          setSelectedOrgId(activeOrg.id);
          setCurrentStep("goal");
        } else {
          // No active org - show org selector
          console.log("[Onboarding] No active org found, showing selector");
          setCurrentStep("select-org");
        }
      }
    }
  }, [user, profile, authLoading, orgLoading, navigate, isCreateNewSurface, activeOrg]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc("is_username_available", {
        _username: usernameToCheck,
      });

      if (error) {
        console.error("Username check error:", error);
        setUsernameAvailable(null);
        return;
      }

      setUsernameAvailable(data as boolean);
    } catch (err) {
      console.error("Failed to check username:", err);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Check slug availability against the selected domain
  const checkSlugAvailability = useCallback(async (slugToCheck: string, pathKey: OnboardingPathKey) => {
    const path = ONBOARDING_PATHS[pathKey];
    if (!path.surfaceType) return; // No slug check needed for non-surface paths
    
    const normalizedSlug = slugToCheck.trim().toLowerCase();
    
    if (!normalizedSlug || normalizedSlug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(normalizedSlug)) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      // Get domain ID from the `domains` table (NOT surface_domains)
      // This ensures slug check uses the same domain_id as publish flow
      const { data: domains, error: domainError } = await supabase
        .from("domains")
        .select("id")
        .eq("host", path.domain)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (domainError || !domains) {
        console.error("Domain lookup error:", domainError);
        setSlugAvailable(null);
        return;
      }

      const { data, error } = await supabase.rpc("is_slug_available", {
        _domain_id: domains.id,
        _slug: normalizedSlug,
      });

      if (error) {
        console.error("Slug check error:", error);
        setSlugAvailable(null);
        return;
      }

      setSlugAvailable(data as boolean);
    } catch (err) {
      console.error("Failed to check slug:", err);
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    checkUsernameAvailability(debouncedUsername);
  }, [debouncedUsername, checkUsernameAvailability]);

  useEffect(() => {
    if (selectedPath && debouncedSlug && ONBOARDING_PATHS[selectedPath].surfaceType) {
      checkSlugAvailability(debouncedSlug, selectedPath);
    }
  }, [debouncedSlug, selectedPath, checkSlugAvailability]);

  // When path is selected, auto-populate slug with username
  useEffect(() => {
    if (selectedPath && savedUsername && ONBOARDING_PATHS[selectedPath].surfaceType) {
      slugForm.setValue("slug", savedUsername);
      setSlugAvailable(null); // Reset to trigger check
    }
  }, [selectedPath, savedUsername, slugForm]);

  const handleUsernameSubmit = (data: UsernameFormData) => {
    if (usernameAvailable !== true) {
      toast.error("Please choose an available username");
      return;
    }
    setSavedUsername(data.username);
    setSavedDisplayName(data.displayName || "");
    setCurrentStep("goal");
  };

  const handlePathSelect = async (pathKey: OnboardingPathKey) => {
    const path = ONBOARDING_PATHS[pathKey];
    setSelectedPath(pathKey);
    
    // If path doesn't create a surface (studio/explore), complete onboarding directly
    if (!path.surfaceType) {
      await completeOnboardingWithoutSurface(pathKey);
    } else {
      setCurrentStep("surface");
    }
  };

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setCurrentStep("goal");
  };

  // Complete onboarding for paths that don't create a surface
  const completeOnboardingWithoutSurface = async (pathKey: OnboardingPathKey) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // For first-time users, we need to set up their profile
      if (!profile?.onboarding_completed) {
        // Update profile directly - no creator_type needed
        const { error } = await supabase
          .from("profiles")
          .update({
            username: savedUsername,
            display_name: savedDisplayName || null,
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (error) {
          if (error.message.includes("username")) {
            toast.error("Username is no longer available");
            setCurrentStep("username");
          } else {
            toast.error(error.message);
          }
          return;
        }

        await refreshProfile();
      }
      
      if (pathKey === "studio") {
        toast.success("Welcome to YANGU Studio! Create amazing AI content.");
        navigate("/dashboard"); // Studio is accessed from dashboard sidebar
      } else {
        toast.success("Welcome to YANGU! Start exploring.");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (data: SlugFormData) => {
    if (!user || !selectedPath) return;
    
    const path = ONBOARDING_PATHS[selectedPath];
    if (!path.surfaceType) return; // Shouldn't happen, but guard
    
    if (slugAvailable === false) {
      toast.error("Please choose an available URL");
      return;
    }

    // Normalize slug to lowercase for storage
    const normalizedSlug = data.slug.trim().toLowerCase();
    
    setIsLoading(true);
    try {
      // If user already completed onboarding (creating additional surface)
      if (isCreateNewSurface && profile?.onboarding_completed) {
        console.log("[Onboarding] Creating new surface directly (user already onboarded)");
        
        const orgId = selectedOrgId || activeOrg?.id;
        if (!orgId) {
          // Auto-create org if missing
          console.warn("[Onboarding] No org found for new surface, auto-creating");
          const { data: newOrg, error: orgErr } = await supabase
            .from("orgs")
            .insert({
              name: `${savedUsername || profile?.username || "My"}'s Organization`,
              owner_user_id: user.id,
            })
            .select("id")
            .single();

          if (orgErr || !newOrg) {
            console.error("Org creation error:", orgErr);
            toast.error("Failed to create organization");
            return;
          }

          const { error: memErr } = await supabase
            .from("org_memberships")
            .insert({ org_id: newOrg.id, user_id: user.id, role: "owner" });

          if (memErr) {
            console.error("Membership error:", memErr);
            toast.error("Failed to set up organization");
            return;
          }

          setSelectedOrgId(newOrg.id);
          queryClient.invalidateQueries({ queryKey: ["active-org"] });
          queryClient.invalidateQueries({ queryKey: ["user-orgs"] });
          // Use the newly created org
          var resolvedNewOrgId = newOrg.id;
        }
        const finalOrgId = orgId || resolvedNewOrgId!;

        // Get domain ID from the `domains` table (same as slug check)
        const { data: domainData, error: domainError } = await supabase
          .from("domains")
          .select("id")
          .eq("host", path.domain)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (domainError || !domainData) {
          console.error("Domain lookup error:", domainError);
          toast.error("Failed to find domain configuration");
          return;
        }

        // Final availability check before creating (race condition guard)
        const { data: stillAvailable } = await supabase.rpc("is_slug_available", {
          _domain_id: domainData.id,
          _slug: normalizedSlug,
        });

        if (!stillAvailable) {
          toast.error("This URL was just taken. Please choose another.");
          setSlugAvailable(false);
          return;
        }

        // Create the surface with draft_slug + draft_domain_id
        const { error: surfaceError } = await supabase
          .from("surfaces")
          .insert({
            org_id: finalOrgId,
            surface_type: path.surfaceType,
            title: `${savedUsername}'s ${path.label}`,
            status: "draft",
            draft_slug: normalizedSlug,
            draft_domain_id: domainData.id,
          } as any);

        if (surfaceError) {
          console.error("Surface creation error:", surfaceError);
          if (surfaceError.message.includes("duplicate") || surfaceError.code === "23505") {
            toast.error("This URL is no longer available");
            setSlugAvailable(false);
          } else {
            toast.error(surfaceError.message || "Failed to create surface");
          }
          return;
        }

        // Invalidate surfaces cache so dashboard shows the new surface
        queryClient.invalidateQueries({ queryKey: ["surfaces"] });
        toast.success("New surface created! Customize it before going live.");
        navigate("/dashboard");
      } else {
        // First-time onboarding: update profile + create surface
        console.log("[Onboarding] First-time onboarding");
        
        // First update the profile (without creator_type)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            username: savedUsername,
            display_name: savedDisplayName || null,
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (profileError) {
          if (profileError.message.includes("username")) {
            toast.error("Username is no longer available");
            setCurrentStep("username");
          } else {
            toast.error(profileError.message);
          }
          return;
        }

        // Get the user's org (should have been created on signup)
        const { data: membership, error: membershipError } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let resolvedOrgId: string;

        if (membershipError || !membership) {
          console.warn("[Onboarding] No org found, auto-creating one");

          // Create org
          const { data: newOrg, error: orgCreateError } = await supabase
            .from("orgs")
            .insert({
              name: `${savedUsername || "My"}'s Organization`,
              owner_user_id: user.id,
            })
            .select("id")
            .single();

          if (orgCreateError || !newOrg) {
            console.error("Org creation error:", orgCreateError);
            toast.error("Failed to create organization");
            return;
          }

          // Create membership
          const { error: memError } = await supabase
            .from("org_memberships")
            .insert({
              org_id: newOrg.id,
              user_id: user.id,
              role: "owner",
            });

          if (memError) {
            console.error("Membership creation error:", memError);
            toast.error("Failed to set up organization membership");
            return;
          }

          resolvedOrgId = newOrg.id;
          // Invalidate org cache
          queryClient.invalidateQueries({ queryKey: ["active-org"] });
          queryClient.invalidateQueries({ queryKey: ["user-orgs"] });
        } else {
          resolvedOrgId = membership.org_id;
        }

        // Get domain ID from the `domains` table
        const { data: domainData, error: domainError } = await supabase
          .from("domains")
          .select("id")
          .eq("host", path.domain)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (domainError || !domainData) {
          console.error("Domain lookup error:", domainError);
          toast.error("Failed to find domain configuration");
          return;
        }

        // Final availability check before creating (race condition guard)
        const { data: stillAvailable } = await supabase.rpc("is_slug_available", {
          _domain_id: domainData.id,
          _slug: normalizedSlug,
        });

        if (!stillAvailable) {
          toast.error("This URL was just taken. Please choose another.");
          setSlugAvailable(false);
          return;
        }

        // Create the surface with draft_slug + draft_domain_id
        const { error: surfaceError } = await supabase
          .from("surfaces")
          .insert({
            org_id: resolvedOrgId,
            surface_type: path.surfaceType,
            title: `${savedUsername}'s ${path.label}`,
            status: "draft",
            draft_slug: normalizedSlug,
            draft_domain_id: domainData.id,
          } as any);

        if (surfaceError) {
          console.error("Surface creation error:", surfaceError);
          toast.error(surfaceError.message || "Failed to create surface");
          return;
        }

        await refreshProfile();
        // Invalidate surfaces cache so dashboard shows the new surface
        queryClient.invalidateQueries({ queryKey: ["surfaces"] });
        toast.success("Welcome to YANGU! Your space is ready.");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep === "goal") {
      if (isCreateNewSurface && profile?.onboarding_completed) {
        if (!activeOrg) {
          setCurrentStep("select-org");
        } else {
          navigate("/dashboard");
        }
      } else {
        setCurrentStep("username");
      }
    } else if (currentStep === "surface") {
      setSelectedPath(null);
      setCurrentStep("goal");
    } else if (currentStep === "select-org") {
      navigate("/dashboard");
    }
  };

  if (authLoading || orgLoading) {
    return (
      <AuthShell title="Loading..." showBackLink={false}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  // Step: Org Selection (only shown when no active org and creating new surface)
  if (currentStep === "select-org") {
    return (
      <AuthShell
        title="Select Organization"
        subtitle="Choose which organization to create the surface in"
        showBackLink={false}
      >
        <OrgSelector onSelect={handleOrgSelect} />
        <Button
          type="button"
          variant="ghost"
          className="w-full mt-4"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </AuthShell>
    );
  }

  // Step 1: Username
  if (currentStep === "username") {
    return (
      <AuthShell
        title="Claim your identity"
        subtitle="Choose a unique username for your YANGU profile"
        showBackLink={false}
      >
        <form onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <AtSign className="h-4 w-4" />
              </div>
              <Input
                id="username"
                placeholder="yourname"
                className="pl-9 pr-10"
                autoComplete="off"
                {...usernameForm.register("username")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <Check className="h-4 w-4 text-success" />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {usernameForm.formState.errors.username ? (
              <p className="text-sm text-destructive">{usernameForm.formState.errors.username.message}</p>
            ) : usernameAvailable === true ? (
              <p className="text-sm text-success">
                {PLATFORM_DOMAIN}/@{username} is available!
              </p>
            ) : usernameAvailable === false ? (
              <p className="text-sm text-destructive">This username is already taken</p>
            ) : username.length >= 3 ? (
              <p className="text-sm text-muted-foreground">
                Your profile: {PLATFORM_DOMAIN}/@{username}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (optional)</Label>
            <Input
              id="displayName"
              placeholder="Your Name"
              autoComplete="name"
              {...usernameForm.register("displayName")}
            />
            {usernameForm.formState.errors.displayName && (
              <p className="text-sm text-destructive">{usernameForm.formState.errors.displayName.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              This is how your name will appear on your surfaces
            </p>
          </div>

          <Button
            type="submit"
            variant="accent"
            className="w-full h-11"
            disabled={usernameAvailable !== true}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </AuthShell>
    );
  }

  // Step 2: Goal Selection (CTA-based)
  if (currentStep === "goal") {
    return (
      <AuthShell
        title="What do you want to do?"
        subtitle="Choose your path - this determines where you'll publish"
        showBackLink={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(ONBOARDING_PATHS).map(([key, path]) => {
              const Icon = path.icon;
              return (
                <Card
                  key={key}
                  variant="outlined"
                  interactive
                  onClick={() => handlePathSelect(key as OnboardingPathKey)}
                  className={cn(
                    "p-4 flex items-center gap-4 transition-all",
                    "hover:border-accent",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className={cn("p-3 rounded-lg", path.bgColor)}>
                    <Icon className={cn("h-5 w-5", path.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{path.label}</h3>
                    <p className="text-sm text-muted-foreground truncate">{path.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono shrink-0">
                    {path.domain}
                  </div>
                </Card>
              );
            })}
          </div>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={goBack}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Step 3: Surface URL (only for paths that create surfaces)
  if (currentStep === "surface" && selectedPath) {
    const pathConfig = ONBOARDING_PATHS[selectedPath];
    const Icon = pathConfig.icon;

    return (
      <AuthShell
        title="Claim your URL"
        subtitle="This will be your public address"
        showBackLink={false}
      >
        <form onSubmit={slugForm.handleSubmit(handleFinalSubmit)} className="space-y-6">
          {/* Selected path indicator */}
          <Card variant="ghost" className={cn("p-3 border", pathConfig.borderColor, pathConfig.bgColor)}>
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", pathConfig.color)} />
              <div>
                <p className="text-sm font-medium">{pathConfig.label}</p>
                <p className="text-xs text-muted-foreground">{pathConfig.domain}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="slug">Your URL</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Link2 className="h-4 w-4" />
              </div>
              <Input
                id="slug"
                placeholder="your-url"
                className="pl-9 pr-10"
                autoComplete="off"
                disabled={isLoading}
                {...slugForm.register("slug")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingSlug && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <Check className="h-4 w-4 text-success" />
                )}
                {!isCheckingSlug && slugAvailable === false && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {slugForm.formState.errors.slug ? (
              <p className="text-sm text-destructive">{slugForm.formState.errors.slug.message}</p>
            ) : slugAvailable === true ? (
              <p className="text-sm text-success">
                {pathConfig.domain}/{slug} is available!
              </p>
            ) : slugAvailable === false ? (
              <p className="text-sm text-destructive">This URL is already taken</p>
            ) : slug.length >= 3 ? (
              <p className="text-sm text-muted-foreground">
                {pathConfig.domain}/{slug}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your space will be created as a draft</li>
              <li>• Customize it before going live</li>
              <li>• You can change the URL later</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              variant="accent"
              className="w-full h-11"
              disabled={isLoading || slugAvailable !== true}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create My Space
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={goBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return null;
}
