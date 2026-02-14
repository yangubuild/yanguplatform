import { useState, useRef } from "react";
import { Gift } from "lucide-react";
import { useActivePromos, PromoCampaign } from "@/hooks/useActivePromos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PromoPopup() {
  const { data: promos, isLoading } = useActivePromos();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  // Local cooldown: track dismissed/claimed keys for this page load
  const cooldownRef = useRef<Set<string>>(new Set());
  // Force re-render after cooldown update
  const [, setTick] = useState(0);

  if (isLoading || !promos || promos.length === 0) return null;

  // Filter out cooled-down promos, sort by soonest ending then newest
  const available = promos
    .filter((p) => !cooldownRef.current.has(p.key))
    .sort((a, b) => {
      // Soonest ending first (nulls last)
      if (a.ends_at && b.ends_at) return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
      if (a.ends_at && !b.ends_at) return -1;
      if (!a.ends_at && b.ends_at) return 1;
      // Then newest first
      return (b.created_at || "").localeCompare(a.created_at || "");
    });

  const current = available[0];
  if (!current) return null;

  const addCooldown = (key: string) => {
    cooldownRef.current.add(key);
    setTick((t) => t + 1);
  };

  const handleClaim = async (promo: PromoCampaign) => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("promo-claim", {
        body: { campaign_key: promo.key },
      });
      if (error || (data && data.error)) {
        toast.error(data?.error || "Failed to claim reward");
      } else if (data?.alreadyRedeemed) {
        toast.info("You've already claimed this reward.");
      } else {
        toast.success(`🎉 ${promo.title} claimed!`);
        queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      }
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    } catch {
      toast.error("Failed to claim reward");
    } finally {
      setClaiming(false);
      addCooldown(promo.key);
    }
  };

  const handleDismiss = async (promo: PromoCampaign) => {
    addCooldown(promo.key);
    try {
      await supabase.rpc("dismiss_promo" as any, { p_campaign_key: promo.key });
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    } catch {
      // silent
    }
  };

  const rewardLabel =
    current.reward_type === "credits"
      ? `${(current.reward_payload as any)?.amount || ""} credits`
      : `+${(current.reward_payload as any)?.extra || ""} ${(current.reward_payload as any)?.asset_type || ""} quota`;

  return (
    <Dialog open onOpenChange={() => handleDismiss(current)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            {current.title}
          </DialogTitle>
          <DialogDescription>{current.message}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Reward</p>
          <p className="text-lg font-semibold">{rewardLabel}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => handleDismiss(current)}
            disabled={claiming}
          >
            Dismiss
          </Button>
          <Button onClick={() => handleClaim(current)} disabled={claiming}>
            {claiming ? "Claiming…" : "Claim"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
