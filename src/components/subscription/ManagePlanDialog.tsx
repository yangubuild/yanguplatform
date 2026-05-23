import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Info, Check } from "lucide-react";
import { useState } from "react";

interface ManagePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  renewDate?: string | null;
}

export function ManagePlanDialog({ open, onOpenChange, planName, renewDate }: ManagePlanDialogProps) {
  const [showCoupon, setShowCoupon] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [gift, setGift] = useState("");
  const [showGift, setShowGift] = useState(false);
  const isPaid = planName.toLowerCase() !== "free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage plan</DialogTitle>
          <DialogDescription>Subscription & billing settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Current plan */}
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">You're on {planName} plan</p>
                {isPaid && renewDate && (
                  <p className="text-xs text-muted-foreground mt-0.5">Renews {renewDate}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>5 daily credits (up to 150/month)</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg shrink-0"
              >
                {isPaid ? "Downgrade to free" : "Upgrade plan"}
              </Button>
            </div>
          </div>

          {/* Gift card */}
          <div className="rounded-xl border border-border bg-background/40 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Gift card balance: <span className="text-muted-foreground font-normal">No balance</span>
              </p>
              <p className="text-xs text-muted-foreground">Automatically applied to subscription payments</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shrink-0"
              onClick={() => setShowGift(!showGift)}
            >
              Redeem
            </Button>
          </div>

          {showGift && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter gift card code"
                value={gift}
                onChange={(e) => setGift(e.target.value)}
                className="rounded-lg"
              />
              <Button className="rounded-lg" size="sm">Apply</Button>
            </div>
          )}

          {/* Coupon */}
          {!showCoupon ? (
            <button
              onClick={() => setShowCoupon(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="underline">Have a coupon code?</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="rounded-lg"
              />
              <Button className="rounded-lg" size="sm">Apply</Button>
            </div>
          )}

          {/* Bottom buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button variant="outline" className="rounded-lg">Edit billing information</Button>
            <Button className="rounded-lg">Invoices & payments</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}