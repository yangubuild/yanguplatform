import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { AuthShell } from "@/components/auth/AuthShell";
import { OrgSelector } from "@/components/OrgSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Check, X, AtSign, Store, Palette, Users, BookOpen, ArrowRight, ArrowLeft, Link2 } from "lucide-react";
import { PLATFORM_DOMAIN } from "@/config/platform";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/primitives/Card";
import { cn } from "@/lib/utils";

// Creator types with their associated domains
const CREATOR_TYPES = {
  seller: {
    id: "seller",
    label: "Seller",
    description: "Sell products online",
    icon: Store,
    domain: "yangu.shop",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
  },
  builder: {
    id: "builder",
    label: "Builder",
    description: "Showcase your portfolio",
    icon: Palette,
    domain: "yangu.studio",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50",
  },
  organization: {
    id: "organization",
    label: "Organization",
    description: "Build a community",
    icon: Users,
    domain: "yangu.community",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/50",
  },
  learner: {
    id: "learner",
    label: "Learner",
    description: "Create your personal site",
    icon: BookOpen,
    domain: "yangu.site",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/50",
  },
} as const;

type CreatorType = keyof typeof CREATOR_TYPES;

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

type OnboardingStep = "username" | "role" | "surface" | "select-org";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  
  // Role state
  const [selectedRole, setSelectedRole] = useState<CreatorType | null>(null);
  
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
          // User has an active org, proceed to role selection
          setSelectedOrgId(activeOrg.id);
          setCurrentStep("role");
        } else {
          // No active org - show org selector (or error)
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

  // Check slug availability - normalize to lowercase for consistency
  const checkSlugAvailability = useCallback(async (slugToCheck: string, creatorType: CreatorType) => {
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
      // Get domain ID for the selected creator type
      const { data: domains, error: domainError } = await supabase
        .from("surface_domains")
        .select("id")
        .eq("domain", CREATOR_TYPES[creatorType].domain)
        .single();

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
    if (selectedRole && debouncedSlug) {
      checkSlugAvailability(debouncedSlug, selectedRole);
    }
  }, [debouncedSlug, selectedRole, checkSlugAvailability]);

  // When role is selected, auto-populate slug with username
  useEffect(() => {
    if (selectedRole && savedUsername) {
      slugForm.setValue("slug", savedUsername);
      setSlugAvailable(null); // Reset to trigger check
    }
  }, [selectedRole, savedUsername, slugForm]);

  const handleUsernameSubmit = (data: UsernameFormData) => {
    if (usernameAvailable !== true) {
      toast.error("Please choose an available username");
      return;
    }
    setSavedUsername(data.username);
    setSavedDisplayName(data.displayName || "");
    setCurrentStep("role");
  };

  const handleRoleSelect = (role: CreatorType) => {
    setSelectedRole(role);
    setCurrentStep("surface");
  };

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setCurrentStep("role");
  };

  const handleFinalSubmit = async (data: SlugFormData) => {
    if (!user || !selectedRole) return;
    if (slugAvailable === false) {
      toast.error("Please choose an available URL");
      return;
    }

    // Normalize slug to lowercase for storage
    const normalizedSlug = data.slug.trim().toLowerCase();
    
    setIsLoading(true);
    try {
      // If user already completed onboarding (creating additional surface), just create the surface directly
      if (isCreateNewSurface && profile?.onboarding_completed) {
        console.log("[Onboarding] Creating new surface directly (user already onboarded)");
        
        // Use the resolved active org - NEVER accept from client
        const orgId = selectedOrgId || activeOrg?.id;
        if (!orgId) {
          toast.error("No organization found. Please complete onboarding first.");
          return;
        }

        // Get domain ID for the selected creator type
        const { data: domainData, error: domainError } = await supabase
          .from("surface_domains")
          .select("id")
          .eq("domain", CREATOR_TYPES[selectedRole].domain)
          .single();

        if (domainError || !domainData) {
          console.error("Domain lookup error:", domainError);
          toast.error("Failed to find domain configuration");
          return;
        }

        // Create the surface in the surfaces table (org-owned)
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("surfaces")
          .insert({
            org_id: orgId,
            surface_type: selectedRole,
            title: `${savedUsername}'s ${CREATOR_TYPES[selectedRole].label} Space`,
            status: "draft",
          })
          .select("id")
          .single();

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

        // Also create corresponding public_surfaces entry (for public display)
        const { error: publicSurfaceError } = await supabase
          .from("public_surfaces")
          .insert({
            user_id: user.id,
            domain_id: domainData.id,
            slug: normalizedSlug,
            title: `${savedUsername}'s ${CREATOR_TYPES[selectedRole].label} Space`,
            is_published: false,
          });

        if (publicSurfaceError) {
          console.error("Public surface creation error:", publicSurfaceError);
          if (publicSurfaceError.message.includes("duplicate") || publicSurfaceError.code === "23505") {
            toast.error("This URL is no longer available");
            setSlugAvailable(false);
          } else {
            toast.error(publicSurfaceError.message || "Failed to create surface");
          }
          return;
        }

        toast.success("New surface created! Customize it before going live.");
        navigate("/dashboard");
      } else {
        // First-time onboarding: call complete_onboarding RPC
        console.log("[Onboarding] First-time onboarding, calling complete_onboarding");
        
        const { error } = await supabase.rpc("complete_onboarding", {
          _user_id: user.id,
          _username: savedUsername,
          _display_name: savedDisplayName || null,
          _creator_type: selectedRole,
          _surface_slug: normalizedSlug,
        });

        if (error) {
          if (error.message.includes("already taken")) {
            toast.error("This URL is no longer available");
            setSlugAvailable(false);
          } else if (error.message.includes("Username")) {
            toast.error(error.message);
            setCurrentStep("username");
          } else {
            toast.error(error.message);
          }
          return;
        }

        await refreshProfile();
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
    if (currentStep === "role") {
      if (isCreateNewSurface && profile?.onboarding_completed) {
        // For create new surface, going back might go to org selector if no active org
        if (!activeOrg) {
          setCurrentStep("select-org");
        } else {
          // Can't go back further, just close
          navigate("/dashboard");
        }
      } else {
        setCurrentStep("username");
      }
    } else if (currentStep === "surface") {
      setSelectedRole(null);
      setCurrentStep("role");
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

  // Step 2: Role Selection
  if (currentStep === "role") {
    return (
      <AuthShell
        title="What brings you here?"
        subtitle="Choose your primary role to get started"
        showBackLink={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(CREATOR_TYPES).map(([key, role]) => {
              const Icon = role.icon;
              return (
                <Card
                  key={key}
                  variant="outlined"
                  interactive
                  onClick={() => handleRoleSelect(key as CreatorType)}
                  className={cn(
                    "p-4 flex items-center gap-4 transition-all",
                    "hover:border-accent"
                  )}
                >
                  <div className={cn("p-3 rounded-lg", role.bgColor)}>
                    <Icon className={cn("h-5 w-5", role.color)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{role.label}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {role.domain}
                  </div>
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Step 3: Surface URL
  if (currentStep === "surface" && selectedRole) {
    const roleConfig = CREATOR_TYPES[selectedRole];
    const Icon = roleConfig.icon;

    return (
      <AuthShell
        title="Claim your URL"
        subtitle="This will be your public address"
        showBackLink={false}
      >
        <form onSubmit={slugForm.handleSubmit(handleFinalSubmit)} className="space-y-6">
          {/* Selected role indicator */}
          <Card variant="ghost" className={cn("p-3 border", roleConfig.borderColor, roleConfig.bgColor)}>
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", roleConfig.color)} />
              <div>
                <p className="text-sm font-medium">{roleConfig.label}</p>
                <p className="text-xs text-muted-foreground">{roleConfig.domain}</p>
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
                {roleConfig.domain}/{slug} is available!
              </p>
            ) : slugAvailable === false ? (
              <p className="text-sm text-destructive">This URL is already taken</p>
            ) : slug.length >= 3 ? (
              <p className="text-sm text-muted-foreground">
                {roleConfig.domain}/{slug}
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
