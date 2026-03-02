import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Stage = "claim" | "success" | "hidden";

export function DashboardCreditPromo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>("claim");
  const [claiming, setClaiming] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(312500);

  // Check if user already claimed
  const { data: profile, isLoading } = useQuery({
    queryKey: ["dashboard-credit-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("dashboard_credit_claimed")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Don't show if loading, no user, or already claimed
  if (isLoading || !user || !profile || profile.dashboard_credit_claimed === true || stage === "hidden") {
    return null;
  }

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_dashboard_credits");
      if (error) throw error;

      const result = data as { success: boolean; balance?: number; error?: string };
      if (!result.success) {
        // Already claimed or error — just hide
        setStage("hidden");
        return;
      }

      setNewBalance(result.balance ?? 312500);
      // Invalidate credits so bottom-right counter updates
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-credit-check"] });
      setStage("success");
    } catch {
      setStage("hidden");
    } finally {
      setClaiming(false);
    }
  };

  const handleContinue = () => {
    setStage("hidden");
  };

  if (stage === "claim") {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[420px] p-0 border-0 overflow-hidden gap-0"
          style={{
            background: "linear-gradient(180deg, #181E26 0%, #0F141A 100%)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          // Hide the default close button
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center px-8 pt-10 pb-8">
            {/* $25 Badge */}
            <div
              className="flex items-center justify-center rounded-2xl mb-6"
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
              }}
            >
              <span className="text-2xl font-bold text-white">$25</span>
            </div>

            {/* Headline */}
            <h2
              className="text-xl font-bold text-center mb-3"
              style={{ color: "#F1F1F1" }}
            >
              Claim $25 of free AI tokens on us
            </h2>

            {/* Description */}
            <p
              className="text-center text-sm mb-8 leading-relaxed max-w-[320px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              We built a powerful AI agent that can help you run your business or
              create a new one. Try it out.
            </p>

            {/* Claim Button */}
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-12 text-base font-semibold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
              }}
            >
              {claiming ? "Claiming…" : "Claim"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (stage === "success") {
    return (
      <Dialog open onOpenChange={() => handleContinue()}>
        <DialogContent
          className="sm:max-w-[420px] p-0 border-0 overflow-hidden gap-0"
          style={{
            background: "linear-gradient(180deg, #181E26 0%, #0F141A 100%)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex flex-col items-center px-8 pt-10 pb-8">
            {/* Title */}
            <h2
              className="text-xl font-bold text-center mb-6"
              style={{ color: "#F1F1F1" }}
            >
              Enjoy your tokens.
            </h2>

            {/* Token Badge */}
            <div
              className="flex items-center justify-center rounded-2xl mb-3"
              style={{
                width: 160,
                height: 72,
                background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
              }}
            >
              <span className="text-2xl font-bold text-white">
                {newBalance.toLocaleString()}
              </span>
            </div>

            {/* Subtext */}
            <p
              className="text-sm mb-8"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              New token balance
            </p>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              className="w-full h-12 text-base font-semibold rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
