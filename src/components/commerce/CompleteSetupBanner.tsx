/**
 * CompleteSetupBanner — appears inside the builder editor when the surface's
 * commerce config is incomplete (no payment methods, or ordering disabled, or
 * no WhatsApp). Opens CommerceSetupChat.
 *
 * Auto-hides once the seller completes the chat.
 */

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicCommerceConfig } from "@/hooks/useSurfaceCommerceConfig";
import { CommerceSetupChat } from "./CommerceSetupChat";

interface CompleteSetupBannerProps {
  surfaceId: string;
  ownerId: string;
}

export function CompleteSetupBanner({ surfaceId, ownerId }: CompleteSetupBannerProps) {
  const { data: config } = usePublicCommerceConfig(surfaceId);
  const [chatOpen, setChatOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`yangu_setup_dismissed_${surfaceId}`) === "1";
  });

  // Completion flag written by CommerceSetupChat.finish() — once setup is
  // done the banner must never reappear (unless the merchant resets setup).
  const completedLocally =
    typeof window !== "undefined" &&
    localStorage.getItem(`yangu_setup_complete_${surfaceId}`) === "1";

  const isComplete =
    completedLocally ||
    (
    !!config?.ordering_enabled &&
    Array.isArray(config?.payment_methods) &&
    config!.payment_methods.length > 0 &&
    !!config?.support_whatsapp
    );

  if (isComplete || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-lg border border-border bg-background shadow-lg p-4 animate-in slide-in-from-bottom-2">
        <button
          onClick={() => {
            localStorage.setItem(`yangu_setup_dismissed_${surfaceId}`, "1");
            setDismissed(true);
          }}
          className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Complete your setup</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Your site is live but needs a few details to start receiving orders.
            </p>
            <Button size="sm" className="w-full" onClick={() => setChatOpen(true)}>
              Complete setup →
            </Button>
          </div>
        </div>
      </div>

      <CommerceSetupChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        surfaceId={surfaceId}
        ownerId={ownerId}
      />
    </>
  );
}