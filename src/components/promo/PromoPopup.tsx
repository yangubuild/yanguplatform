import { useState } from "react";
import { Gift, X } from "lucide-react";
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
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (isLoading || !promos || promos.length === 0) return null;

  // Show first non-dismissed promo
  const current = promos.find((p) => !dismissed.has(p.key));
  if (!current) return null;

  const handleClaim = async (promo: PromoCampaign) => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("promo-claim", {
        body: { campaign_key: promo.key },
      });
      if (error || (data && data.error)) {
        toast.error(data?.error || "Failed to claim reward");
      } else {
        toast.success(`🎉 ${promo.title} claimed!`);
        queryClient.invalidateQueries({ queryKey: ["active-promos"] });
        queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      }
    } catch {
      toast.error("Failed to claim reward");
    } finally {
      setClaiming(false);
      setDismissed((prev) => new Set(prev).add(promo.key));
    }
  };

  const handleDismiss = async (promo: PromoCampaign) => {
    setDismissing(true);
    try {
      await supabase.rpc("dismiss_promo" as any, { p_campaign_key: promo.key });
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    } catch {
      // silent
    } finally {
      setDismissing(false);
      setDismissed((prev) => new Set(prev).add(promo.key));
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
            disabled={dismissing}
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
