import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";

const upgradeOptions = [
  { label: "No additional credits", value: "0", price: 0, credits: 0 },
  { label: "+100 additional credits", value: "100", price: 18, credits: 100 },
  { label: "+300 additional credits", value: "300", price: 52, credits: 300 },
  { label: "+700 additional credits", value: "700", price: 115, credits: 700 },
  { label: "+1100 additional credits", value: "1100", price: 175, credits: 1100 },
  { label: "+1900 additional credits", value: "1900", price: 290, credits: 1900 },
  { label: "+2900 additional credits", value: "2900", price: 430, credits: 2900 },
  { label: "+3900 additional credits", value: "3900", price: 570, credits: 3900 },
];

const topupOptions = [
  { label: "+50 credits", value: "50", price: 6 },
  { label: "+100 credits", value: "100", price: 11 },
  { label: "+250 credits", value: "250", price: 26 },
  { label: "+500 credits", value: "500", price: 49 },
  { label: "+1000 credits", value: "1000", price: 95 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
}

export function TopUpCreditsDialog({ open, onOpenChange, currentPlan }: Props) {
  const [mode, setMode] = useState<"upgrade" | "topup">("upgrade");
  const [upgradeChoice, setUpgradeChoice] = useState("100");
  const [topupChoice, setTopupChoice] = useState("100");

  const upgrade = upgradeOptions.find((o) => o.value === upgradeChoice)!;
  const topup = topupOptions.find((o) => o.value === topupChoice)!;

  const basePrice = 12; // yangu+ base
  const dueToday = basePrice + upgrade.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Add more credits</DialogTitle>
          <DialogDescription>
            Upgrade your plan for better value, or top up credits one time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upgrade your plan */}
          <button
            type="button"
            onClick={() => setMode("upgrade")}
            className={cn(
              "w-full text-left rounded-xl border bg-background/40 p-5 transition-colors",
              mode === "upgrade" ? "border-primary ring-1 ring-primary/40" : "border-border"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="font-semibold text-foreground">Upgrade your plan</p>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  mode === "upgrade" ? "border-primary" : "border-muted-foreground"
                )}
              >
                {mode === "upgrade" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Current plan</span>
                <span>{currentPlan} · $0/mo</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Upgrade to</span>
                <span>Yangu+ · ${basePrice}/mo</span>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">${dueToday}</p>
                <p className="text-xs text-muted-foreground">due today · incl. VAT</p>
              </div>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Subscribe & save 30%
              </span>
            </div>

            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <Select value={upgradeChoice} onValueChange={setUpgradeChoice}>
                <SelectTrigger className="rounded-lg bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {upgradeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </button>

          {/* Top up credits */}
          <button
            type="button"
            onClick={() => setMode("topup")}
            className={cn(
              "w-full text-left rounded-xl border bg-background/40 p-5 transition-colors",
              mode === "topup" ? "border-primary ring-1 ring-primary/40" : "border-border"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-foreground">Top up credits</p>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  mode === "topup" ? "border-primary" : "border-muted-foreground"
                )}
              >
                {mode === "topup" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Purchase credits on demand. Valid for 12 months. Prices incl. VAT.
            </p>
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={topupChoice} onValueChange={setTopupChoice}>
                <SelectTrigger className="rounded-lg bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {topupOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — ${o.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="rounded-lg">
              {mode === "upgrade" ? "Upgrade plan" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}