import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Check, X, AtSign, ArrowRight, ArrowLeft, Link2,
  ShoppingBag, Package, Hotel, Users, Sparkles, Eye, Radio,
  Camera, User, ChevronDown
} from "lucide-react";
import { PLATFORM_DOMAIN } from "@/config/platform";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Preset avatars – use YANGU 3D animal emojis from public/avatars
import { YANGU_EMOJIS, getEmojiAvatarUrl } from "@/lib/avatarUtils";

const PRESET_AVATARS = YANGU_EMOJIS.map(({ key }) => getEmojiAvatarUrl(key));

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
    creatorType: "seller" as const,
    redirectTo: "/dashboard",
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
    creatorType: "seller" as const,
    redirectTo: "/dashboard",
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
    creatorType: "builder" as const,
    redirectTo: "/dashboard",
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
    creatorType: "organization" as const,
    redirectTo: "/community",
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
    creatorType: "seller" as const,
    redirectTo: "/dashboard",
  },
  studio: {
    id: "studio",
    label: "Create Ads with AI",
    description: "Generate ads, videos, images from product links",
    icon: Sparkles,
    domain: "yangu.studio",
    surfaceType: null,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50",
    creatorType: "builder" as const,
    redirectTo: "/studio",
  },
  explore: {
    id: "explore",
    label: "Just Explore",
    description: "Browse, discover, join communities, and find inspiration",
    icon: Eye,
    domain: "yangu.io",
    surfaceType: null,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/50",
    creatorType: "builder" as const,
    redirectTo: "/dashboard",
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

type OnboardingStep = "identity" | "category" | "country" | "business" | "surface";

// Countries list (common African + global)
const COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Nigeria",
  "Ghana", "South Africa", "Egypt", "Morocco", "Senegal", "Cameroon",
  "Côte d'Ivoire", "Democratic Republic of Congo", "Mozambique", "Zambia", "Zimbabwe",
  "United States", "United Kingdom", "Canada", "India", "United Arab Emirates",
  "Saudi Arabia", "China", "Australia", "Germany", "France", "Brazil",
  "Japan", "South Korea", "Indonesia", "Philippines", "Malaysia", "Thailand",
  "Mexico", "Colombia", "Argentina", "Turkey", "Pakistan", "Bangladesh",
  "Vietnam", "Poland", "Netherlands", "Sweden", "Norway", "Denmark",
  "Finland", "Switzerland", "Austria", "Belgium", "Italy", "Spain", "Portugal",
  "Ireland", "New Zealand", "Singapore", "Israel", "Chile", "Peru",
];

function inferCountryFromLocale(): string {
  try {
    const locale = navigator.language || "en-US";
    const regionMap: Record<string, string> = {
      KE: "Kenya", UG: "Uganda", TZ: "Tanzania", RW: "Rwanda",
      NG: "Nigeria", GH: "Ghana", ZA: "South Africa", US: "United States",
      GB: "United Kingdom", CA: "Canada", IN: "India", AE: "United Arab Emirates",
      DE: "Germany", FR: "France", AU: "Australia",
    };
    const parts = locale.split("-");
    const region = parts[1]?.toUpperCase();
    if (region && regionMap[region]) return regionMap[region];
  } catch { /* fallback */ }
  return "Kenya";
}

// Progress bar component
function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full h-1.5 rounded-full bg-border/30 mb-8 overflow-hidden">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrg();

  const isCreateNewSurface = searchParams.get("new") === "1";

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("identity");
  const [isLoading, setIsLoading] = useState(false);

  // Identity state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [savedUsername, setSavedUsername] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Category state
  const [selectedPath, setSelectedPath] = useState<OnboardingPathKey | null>(null);

  // Country state
  const [selectedCountry, setSelectedCountry] = useState(inferCountryFromLocale());

  // Business name state
  const [businessName, setBusinessName] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Slug state
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

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
        navigate("/auth/login");
      } else if (profile?.onboarding_completed && !isCreateNewSurface) {
        navigate("/dashboard");
      } else if (isCreateNewSurface && profile?.onboarding_completed) {
        setSavedUsername(profile.username || "");
        setSavedDisplayName(profile.display_name || "");
        if (activeOrg) {
          setCurrentStep("category");
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
      if (error) { setUsernameAvailable(null); return; }
      setUsernameAvailable(data as boolean);
    } catch { setUsernameAvailable(null); }
    finally { setIsCheckingUsername(false); }
  }, []);

  // Check slug availability
  const checkSlugAvailability = useCallback(async (slugToCheck: string, pathKey: OnboardingPathKey) => {
    const path = ONBOARDING_PATHS[pathKey];
    if (!path.surfaceType) return;
    const normalizedSlug = slugToCheck.trim().toLowerCase();
    if (!normalizedSlug || normalizedSlug.length < 3) { setSlugAvailable(null); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(normalizedSlug)) { setSlugAvailable(null); return; }
    setIsCheckingSlug(true);
    try {
      const { data: domains } = await supabase
        .from("domains").select("id").eq("host", path.domain).eq("is_active", true).limit(1).maybeSingle();
      if (!domains) { setSlugAvailable(null); return; }
      const { data } = await supabase.rpc("is_slug_available", { _domain_id: domains.id, _slug: normalizedSlug });
      setSlugAvailable(data as boolean);
    } catch { setSlugAvailable(null); }
    finally { setIsCheckingSlug(false); }
  }, []);

  useEffect(() => { checkUsernameAvailability(debouncedUsername); }, [debouncedUsername, checkUsernameAvailability]);

  useEffect(() => {
    if (selectedPath && debouncedSlug && ONBOARDING_PATHS[selectedPath].surfaceType) {
      checkSlugAvailability(debouncedSlug, selectedPath);
    }
  }, [debouncedSlug, selectedPath, checkSlugAvailability]);

  // Auto-populate slug from username when entering surface step
  useEffect(() => {
    if (currentStep === "surface" && selectedPath && savedUsername && ONBOARDING_PATHS[selectedPath].surfaceType) {
      slugForm.setValue("slug", savedUsername);
      setSlugAvailable(null);
    }
  }, [currentStep, selectedPath, savedUsername, slugForm]);

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      setShowAvatarPicker(false);
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // AI business name suggestions
  const generateBusinessNames = async () => {
    if (!selectedPath) return;
    setLoadingSuggestions(true);
    try {
      const path = ONBOARDING_PATHS[selectedPath];
      const { data, error } = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Generate 6 creative, short business names for a ${path.label} business in ${selectedCountry}. Category: ${path.description}. Return ONLY a JSON array of strings, nothing else. Example: ["Name1","Name2"]`
          }],
          model: "gemini-2.5-flash-lite",
        },
      });
      if (error) throw error;
      const content = data?.content || data?.message || "";
      const match = content.match(/\[.*\]/s);
      if (match) {
        const names = JSON.parse(match[0]);
        setAiSuggestions(names.slice(0, 6));
      }
    } catch (err) {
      console.error("AI suggestions error:", err);
      toast.error("Could not generate suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // === STEP HANDLERS ===

  // Mark onboarding started on first step transition
  const markOnboardingStarted = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({
        onboarding_started_at: new Date().toISOString(),
        account_status: 'onboarding_in_progress',
        onboarding_step: 'identity',
      } as any).eq("id", user.id).is("onboarding_started_at" as any, null);
    } catch (err) {
      console.error("Failed to mark onboarding started:", err);
    }
  }, [user]);

  const updateOnboardingStep = useCallback(async (step: string) => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({
        onboarding_step: step,
      } as any).eq("id", user.id);
    } catch (err) {
      console.error("Failed to update onboarding step:", err);
    }
  }, [user]);

  const handleIdentitySubmit = (data: UsernameFormData) => {
    if (usernameAvailable !== true) {
      toast.error("Please choose an available username");
      return;
    }
    setSavedUsername(data.username);
    setSavedDisplayName(data.displayName || "");
    markOnboardingStarted();
    setCurrentStep("category");
  };

  const handleCategorySelect = (pathKey: OnboardingPathKey) => {
    setSelectedPath(pathKey);
    updateOnboardingStep('category');
    setCurrentStep("country");
  };

  const handleCountryContinue = () => {
    if (!selectedCountry) {
      toast.error("Please select a country");
      return;
    }
    updateOnboardingStep('country');
    setCurrentStep("business");
  };

  const handleBusinessContinue = () => {
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }
    if (!selectedPath) return;
    const path = ONBOARDING_PATHS[selectedPath];
    if (!path.surfaceType) {
      completeOnboardingWithoutSurface();
    } else {
      setCurrentStep("surface");
    }
  };

  // Ensure org + membership exist (silent, with retry)
  const ensureOrg = async (): Promise<string | null> => {
    if (!user) return null;

    // Check existing
    const { data: existing } = await supabase
      .from("org_memberships").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (existing) return existing.org_id;

    // Create with retry
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data: newOrg, error: orgErr } = await supabase
          .from("orgs")
          .insert({ name: `${savedUsername || businessName || "My"}'s Organization`, owner_user_id: user.id })
          .select("id").single();
        if (orgErr || !newOrg) {
          if (attempt === 0) { await new Promise(r => setTimeout(r, 500)); continue; }
          throw orgErr;
        }
        const { error: memErr } = await supabase
          .from("org_memberships").insert({ org_id: newOrg.id, user_id: user.id, role: "owner" });
        if (memErr) throw memErr;
        queryClient.invalidateQueries({ queryKey: ["active-org"] });
        queryClient.invalidateQueries({ queryKey: ["user-orgs"] });
        return newOrg.id;
      } catch (err) {
        if (attempt === 1) { console.error("Org creation failed:", err); return null; }
        await new Promise(r => setTimeout(r, 500));
      }
    }
    return null;
  };

  const completeOnboardingWithoutSurface = async () => {
    if (!user || !selectedPath) return;
    setIsLoading(true);
    try {
      const orgId = await ensureOrg();
      if (!orgId) { toast.error("Failed to set up organization. Please try again."); return; }

      const path = ONBOARDING_PATHS[selectedPath];
      const { error } = await supabase.from("profiles").update({
        username: savedUsername,
        display_name: savedDisplayName || null,
        avatar_url: avatarUrl,
        creator_type: path.creatorType,
        country: selectedCountry,
        business_name: businessName,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        account_status: 'active',
        onboarding_step: null,
      } as any).eq("id", user.id);

      if (error) {
        if (error.message.includes("username")) { toast.error("Username is no longer available"); setCurrentStep("identity"); }
        else toast.error(error.message);
        return;
      }

      await refreshProfile();
      // Fire-and-forget welcome email
      supabase.functions.invoke('send-welcome-email').catch(err =>
        console.warn('Welcome email failed (non-blocking):', err)
      );
      toast.success("Welcome to yangu!");
      navigate(path.redirectTo);
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
    if (!path.surfaceType) return;
    if (slugAvailable === false) { toast.error("Please choose an available URL"); return; }

    const normalizedSlug = data.slug.trim().toLowerCase();
    setIsLoading(true);
    try {
      // For additional surface creation (already onboarded)
      if (isCreateNewSurface && profile?.onboarding_completed) {
        const orgId = activeOrg?.id || await ensureOrg();
        if (!orgId) { toast.error("Failed to find organization"); return; }

        const { data: domainData } = await supabase.from("domains").select("id").eq("host", path.domain).eq("is_active", true).limit(1).maybeSingle();
        if (!domainData) { toast.error("Failed to find domain configuration"); return; }

        const { data: stillAvailable } = await supabase.rpc("is_slug_available", { _domain_id: domainData.id, _slug: normalizedSlug });
        if (!stillAvailable) { toast.error("This URL was just taken. Please choose another."); setSlugAvailable(false); return; }

        await supabase.from("surfaces").insert({
          org_id: orgId, surface_type: path.surfaceType,
          title: `${savedUsername}'s ${path.label}`, status: "draft",
          draft_slug: normalizedSlug, draft_domain_id: domainData.id,
        } as any);

        queryClient.invalidateQueries({ queryKey: ["surfaces"] });
        toast.success("New surface created!");
        navigate("/dashboard");
        return;
      }

      // First-time onboarding
      const orgId = await ensureOrg();
      if (!orgId) { toast.error("Failed to set up organization. Please try again."); return; }

      // Update profile (without completing yet)
      const { error: profileError } = await supabase.from("profiles").update({
        username: savedUsername,
        display_name: savedDisplayName || null,
        avatar_url: avatarUrl,
        creator_type: path.creatorType,
        country: selectedCountry,
        business_name: businessName,
      }).eq("id", user.id);

      if (profileError) {
        if (profileError.message.includes("username")) { toast.error("Username is no longer available"); setCurrentStep("identity"); }
        else toast.error(profileError.message);
        return;
      }

      // Get domain
      const { data: domainData } = await supabase.from("domains").select("id").eq("host", path.domain).eq("is_active", true).limit(1).maybeSingle();
      if (!domainData) { toast.error("Failed to find domain configuration"); return; }

      // Race-condition check
      const { data: stillAvailable } = await supabase.rpc("is_slug_available", { _domain_id: domainData.id, _slug: normalizedSlug });
      if (!stillAvailable) { toast.error("This URL was just taken. Please choose another."); setSlugAvailable(false); return; }

      // Create surface
      const { error: surfaceError } = await supabase.from("surfaces").insert({
        org_id: orgId, surface_type: path.surfaceType,
        title: `${savedUsername}'s ${path.label}`, status: "draft",
        draft_slug: normalizedSlug, draft_domain_id: domainData.id,
      } as any);

      if (surfaceError) {
        toast.error(surfaceError.message || "Failed to create surface");
        return;
      }

      // NOW mark onboarding complete
      const { error: completeError } = await supabase.from("profiles").update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        account_status: 'active',
        onboarding_step: null,
      } as any).eq("id", user.id);
      if (completeError) { toast.error("Setup issue — please try again."); return; }

      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["surfaces"] });
      toast.success("Welcome to yangu! Your space is ready.");
      navigate(path.redirectTo);
    } catch (err) {
      console.error("Onboarding error:", err);
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "category":
        if (isCreateNewSurface) navigate("/dashboard");
        else setCurrentStep("identity");
        break;
      case "country": setCurrentStep("category"); break;
      case "business": setCurrentStep("country"); break;
      case "surface": setCurrentStep("business"); break;
    }
  };

  const stepIndex = { identity: 1, category: 2, country: 3, business: 4, surface: 5 };
  const totalSteps = selectedPath && !ONBOARDING_PATHS[selectedPath]?.surfaceType ? 4 : 5;

  if (authLoading || orgLoading) {
    return (
      <AuthShell title="Loading..." showBackLink={false}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  // === STEP 1: IDENTITY ===
  if (currentStep === "identity") {
    return (
      <AuthShell title="Claim your identity" subtitle="Choose a unique username for your yangu profile" showBackLink={false}>
        <StepProgress current={1} total={totalSteps} />
        <form onSubmit={usernameForm.handleSubmit(handleIdentitySubmit)} className="space-y-6">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-20 h-20 rounded-full bg-muted border-2 border-border hover:border-accent transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground absolute inset-0 m-auto" />
              )}
              <div className="absolute bottom-0 right-0 bg-accent rounded-full p-1">
                <Camera className="w-3 h-3 text-accent-foreground" />
              </div>
            </button>
            <span className="text-xs text-muted-foreground">Tap to choose avatar</span>
          </div>

          {showAvatarPicker && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
              <p className="text-sm font-medium">Choose an avatar</p>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AVATARS.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setAvatarUrl(src); setShowAvatarPicker(false); }}
                    className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2 transition-all focus:outline-none",
                      avatarUrl === src ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-accent/50"
                    )}
                  >
                    <img src={src} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
                  Upload photo
                </Button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <AtSign className="h-4 w-4" />
              </div>
              <Input
                id="username" placeholder="yourname"
                className="pl-9 pr-10 focus:ring-accent focus:border-accent focus-visible:ring-accent"
                autoComplete="off"
                {...usernameForm.register("username")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isCheckingUsername && usernameAvailable === true && <Check className="h-4 w-4 text-success" />}
                {!isCheckingUsername && usernameAvailable === false && <X className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {usernameForm.formState.errors.username ? (
              <p className="text-sm text-destructive">{usernameForm.formState.errors.username.message}</p>
            ) : usernameAvailable === true ? (
              <p className="text-sm text-success">{PLATFORM_DOMAIN}/@{username} is available!</p>
            ) : usernameAvailable === false ? (
              <p className="text-sm text-destructive">This username is already taken</p>
            ) : username.length >= 3 ? (
              <p className="text-sm text-muted-foreground">Your profile: {PLATFORM_DOMAIN}/@{username}</p>
            ) : null}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (optional)</Label>
            <Input
              id="displayName" placeholder="Your Name"
              className="focus:ring-accent focus:border-accent focus-visible:ring-accent"
              autoComplete="name"
              {...usernameForm.register("displayName")}
            />
            <p className="text-sm text-muted-foreground">This is how your name will appear on your surfaces</p>
          </div>

          <Button type="submit" variant="accent" className="w-full h-11" disabled={usernameAvailable !== true}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </AuthShell>
    );
  }

  // === STEP 2: CATEGORY ===
  if (currentStep === "category") {
    return (
      <AuthShell title="What do you want to do?" subtitle="Choose your path - this determines where you'll publish" showBackLink={false} maxWidth="max-w-[960px]">
        <StepProgress current={2} total={totalSteps} />
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Object.entries(ONBOARDING_PATHS).map(([key, path]) => {
              const Icon = path.icon;
              const isSelected = selectedPath === key;
              return (
                <button
                  key={key}
                  onClick={() => handleCategorySelect(key as OnboardingPathKey)}
                  disabled={isLoading}
                  className={cn(
                    "relative p-4 sm:p-6 rounded-2xl border text-left transition-all min-h-[140px] sm:min-h-[170px] flex flex-col justify-between overflow-hidden",
                    "bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:shadow-[0_0_30px_rgba(255,120,0,0.12)] focus:outline-none",
                    isSelected
                      ? "border-accent ring-1 ring-accent/30"
                      : "border-border/60 hover:border-border",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  {/* Subtle gradient glow behind card */}
                  <div className={cn("absolute inset-0 opacity-[0.07] rounded-2xl pointer-events-none", path.bgColor)} />

                  <div className="relative z-10 flex flex-col gap-3">
                    <div className={cn("p-2.5 rounded-lg w-fit", path.bgColor)}>
                      <Icon className={cn("h-5 w-5", path.color)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{path.label}</h3>
                      <p className="text-sm text-muted-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">{path.description}</p>
                    </div>
                  </div>

                  <div className="relative z-10 text-[11px] text-muted-foreground/60 font-mono mt-4">
                    {path.domain}
                  </div>
                </button>
              );
            })}
          </div>

          <Button type="button" variant="ghost" className="w-full" onClick={goBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </AuthShell>
    );
  }

  // === STEP 3: COUNTRY ===
  if (currentStep === "country") {
    return (
      <AuthShell title="What country are you in?" subtitle="Select the country where you or your business is located" showBackLink={false}>
        <StepProgress current={3} total={totalSteps} />
        <div className="space-y-6">
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className={cn(
                "w-full h-12 px-4 pr-10 rounded-xl border border-border bg-card text-foreground",
                "appearance-none cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              )}
            >
              {COUNTRIES.sort().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <Button
            type="button"
            variant="accent"
            className="w-full h-11"
            onClick={handleCountryContinue}
            disabled={!selectedCountry}
          >
            Continue
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </AuthShell>
    );
  }

  // === STEP 4: BUSINESS NAME ===
  if (currentStep === "business") {
    return (
      <AuthShell title="Name your business" subtitle="This can be changed later" showBackLink={false}>
        <StepProgress current={4} total={totalSteps} />
        <div className="space-y-6">
          <div className="relative">
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
              className="pr-12 h-12 focus:ring-accent focus:border-accent focus-visible:ring-accent"
            />
            <button
              type="button"
              onClick={generateBusinessNames}
              disabled={loadingSuggestions}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors focus:outline-none"
              title="Get AI suggestions"
            >
              {loadingSuggestions ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : (
                <Sparkles className="h-4 w-4 text-accent" />
              )}
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setBusinessName(name); setAiSuggestions([]); }}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:border-accent/50 hover:bg-accent/5 transition-all focus:outline-none"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="accent"
            className="w-full h-11"
            onClick={handleBusinessContinue}
            disabled={!businessName.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {selectedPath && !ONBOARDING_PATHS[selectedPath]?.surfaceType ? "Create My Space" : "Next"}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={goBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </AuthShell>
    );
  }

  // === STEP 5: CLAIM URL ===
  if (currentStep === "surface" && selectedPath) {
    const pathConfig = ONBOARDING_PATHS[selectedPath];
    const Icon = pathConfig.icon;

    return (
      <AuthShell title="Claim your URL" subtitle="This will be your public address" showBackLink={false}>
        <StepProgress current={5} total={5} />
        <form onSubmit={slugForm.handleSubmit(handleFinalSubmit)} className="space-y-6">
          {/* Selected path indicator */}
          <div className={cn("p-3 rounded-xl border", pathConfig.borderColor, pathConfig.bgColor)}>
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5", pathConfig.color)} />
              <div>
                <p className="text-sm font-medium">{pathConfig.label}</p>
                <p className="text-xs text-muted-foreground">{pathConfig.domain}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Your URL</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Link2 className="h-4 w-4" />
              </div>
              <Input
                id="slug" placeholder="your-url"
                className="pl-9 pr-10 focus:ring-accent focus:border-accent focus-visible:ring-accent"
                autoComplete="off" disabled={isLoading}
                {...slugForm.register("slug")}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isCheckingSlug && slugAvailable === true && <Check className="h-4 w-4 text-success" />}
                {!isCheckingSlug && slugAvailable === false && <X className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {slugForm.formState.errors.slug ? (
              <p className="text-sm text-destructive">{slugForm.formState.errors.slug.message}</p>
            ) : slugAvailable === true ? (
              <p className="text-sm text-success">{pathConfig.domain}/{slug} is available!</p>
            ) : slugAvailable === false ? (
              <p className="text-sm text-destructive">This URL is already taken</p>
            ) : slug.length >= 3 ? (
              <p className="text-sm text-muted-foreground">{pathConfig.domain}/{slug}</p>
            ) : null}
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your space will be created as a draft</li>
              <li>• Customize it before going live</li>
              <li>• You can change the URL later</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button type="submit" variant="accent" className="w-full h-11" disabled={isLoading || slugAvailable !== true}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create My Space
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={goBack} disabled={isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return null;
}
