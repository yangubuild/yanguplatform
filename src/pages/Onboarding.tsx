import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Check, X, AtSign } from "lucide-react";
import { PLATFORM_DOMAIN } from "@/config/platform";
import { useDebounce } from "@/hooks/useDebounce";

const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  displayName: z.string().trim().max(100, "Display name too long").optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      displayName: "",
    },
  });

  const username = form.watch("username");
  const debouncedUsername = useDebounce(username, 500);

  // Redirect if not authenticated or already onboarded
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth/login");
      } else if (profile?.onboarding_completed) {
        navigate("/dashboard");
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Validate format first
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

  useEffect(() => {
    checkUsernameAvailability(debouncedUsername);
  }, [debouncedUsername, checkUsernameAvailability]);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    if (usernameAvailable === false) {
      toast.error("Please choose an available username");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc("complete_onboarding", {
        _user_id: user.id,
        _username: data.username,
        _display_name: data.displayName || null,
      });

      if (error) {
        if (error.message.includes("already taken")) {
          toast.error("This username is no longer available");
          setUsernameAvailable(false);
        } else {
          toast.error(error.message);
        }
        return;
      }

      await refreshProfile();
      toast.success("Welcome to YANGU!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AuthShell
        title="Loading..."
        showBackLink={false}
      >
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Claim your identity"
      subtitle="Choose a unique username for your YANGU profile"
      showBackLink={false}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              disabled={isLoading}
              {...form.register("username")}
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
          {form.formState.errors.username ? (
            <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
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
            disabled={isLoading}
            {...form.register("displayName")}
          />
          {form.formState.errors.displayName && (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            This is how your name will appear on your surfaces
          </p>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="w-full h-11"
          disabled={isLoading || usernameAvailable !== true}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Setup
        </Button>
      </form>
    </AuthShell>
  );
}
