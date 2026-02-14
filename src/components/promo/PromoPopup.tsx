import { useState, useCallback, useMemo } from "react";
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

const DISMISSED_PREFIX = "promo_popup_dismissed:";
const CLAIMED_PREFIX = "promo_popup_claimed:";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function readStore(prefix: string): Record<string, number> {
  const out: Record<string, number> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          out[key.slice(prefix.length)] = parsed.ts;
        }
      }
    }
  } catch { /* ignore */ }
  return out;
}

function setStore(prefix: string, id: string) {
  try {
    localStorage.setItem(`${prefix}${id}`, JSON.stringify({ ts: Date.now() }));
  } catch { /* ignore */ }
}

function pruneExpired() {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(DISMISSED_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const { ts } = JSON.parse(raw);
          if (now - ts >= COOLDOWN_MS) localStorage.removeItem(key);
        }
      }
    }
  } catch { /* ignore */ }
}

function isCooledDown(id: string): boolean {
  const claimed = readStore(CLAIMED_PREFIX);
  if (claimed[id] != null) return true;

  const dismissed = readStore(DISMISSED_PREFIX);
  if (dismissed[id] != null && Date.now() - dismissed[id] < COOLDOWN_MS) return true;

  return false;
}

export function PromoPopup() {
  const { data: promos, isLoading } = useActivePromos();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());

  // Prune on mount (runs once per render cycle, cheap)
  useMemo(() => pruneExpired(), []);

  const available = useMemo(() => {
    if (!promos) return [];
    return promos
      .filter((p) => !localHidden.has(p.id) && !isCooledDown(p.id))
      .sort((a, b) => {
        if (a.ends_at && b.ends_at) return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
        if (a.ends_at && !b.ends_at) return -1;
        if (!a.ends_at && b.ends_at) return 1;
        return (b.created_at || "").localeCompare(a.created_at || "");
      });
  }, [promos, localHidden]);

  const hide = useCallback((id: string) => {
    setLocalHidden((prev) => new Set(prev).add(id));
  }, []);

  if (isLoading || available.length === 0) return null;

  const current = available[0];

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
      setStore(CLAIMED_PREFIX, promo.id);
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    } catch {
      toast.error("Failed to claim reward");
    } finally {
      setClaiming(false);
      hide(promo.id);
    }
  };

  const handleDismiss = async (promo: PromoCampaign) => {
    setStore(DISMISSED_PREFIX, promo.id);
    hide(promo.id);
    try {
      await supabase.rpc("dismiss_promo" as any, { p_campaign_key: promo.key });
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    } catch { /* silent */ }
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
          <Button variant="outline" onClick={() => handleDismiss(current)} disabled={claiming}>
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
