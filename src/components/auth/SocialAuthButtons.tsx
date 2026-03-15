import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cloudAuth } from "@/integrations/cloudAuth";

interface SocialAuthButtonsProps {
  disabled?: boolean;
}

export function SocialAuthButtons({ disabled }: SocialAuthButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const getPostAuthDestination = () => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!rawReturnTo) return "/dashboard";

    try {
      const decoded = decodeURIComponent(rawReturnTo);
      if (decoded.startsWith("/")) return decoded;

      const parsed = new URL(decoded);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // ignore malformed returnTo and fallback below
    }

    return "/dashboard";
  };

  const setProviderLoading = (provider: "google" | "apple", loading: boolean) => {
    if (provider === "google") {
      setIsGoogleLoading(loading);
    } else {
      setIsAppleLoading(loading);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    const providerName = provider === "google" ? "Google" : "Apple";
    setProviderLoading(provider, true);

    // Debug logging for OAuth state tracking (helps diagnose iOS Safari issues)
    console.log(`[OAuth] Starting ${providerName} sign-in`, {
      origin: window.location.origin,
      redirectUri: window.location.origin,
      userAgent: navigator.userAgent,
      time: new Date().toISOString(),
    });

    try {
      const result = await cloudAuth.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });

      if (result.error) {
        toast.error(`Failed to sign in with ${providerName}`);
        console.error(`[OAuth] ${providerName} error:`, result.error);
        return;
      }

      // In non-iframe contexts the SDK redirects the browser and this function won't continue.
      if (result.redirected) return;

      // In iframe/preview contexts OAuth returns tokens via web_message; route manually.
      window.location.href = getPostAuthDestination();
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error(`[OAuth] ${providerName} unexpected error:`, err);
    } finally {
      setProviderLoading(provider, false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 rounded-lg"
        onClick={() => handleSocialSignIn("google")}
        disabled={disabled || isGoogleLoading || isAppleLoading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isGoogleLoading ? "Signing in..." : "Continue with Google"}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 rounded-[14px]"
        onClick={() => handleSocialSignIn("apple")}
        disabled={disabled || isGoogleLoading || isAppleLoading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        {isAppleLoading ? "Signing in..." : "Continue with Apple"}
      </Button>
    </div>
  );
}
