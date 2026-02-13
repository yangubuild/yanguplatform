import { useState } from "react";
import { CreditCard, Search, Plus, Minus, Gift, Clock, RotateCcw, AlertTriangle, Send } from "lucide-react";
import { AdaGlassModule } from "./AdaGlassModule";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminAction {
  id: string;
  action: string;
  target: string;
  amount?: number;
  timestamp: string;
}

const BONUS_PRESETS = [50, 100, 250];

export function CreditsBillingPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; username: string; balance: number; plan: string; rateLimit: string } | null>(null);
  const [actionLog, setActionLog] = useState<AdminAction[]>([]);
  const [creditAmount, setCreditAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Grant modal state
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  const logAction = (action: string, target: string, amount?: number) => {
    setActionLog((prev) => [
      { id: `${Date.now()}`, action, target, amount, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19),
    ]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setSelectedUser({
        id: "stub-user-id",
        email: searchQuery.includes("@") ? searchQuery : `${searchQuery}@example.com`,
        username: searchQuery.includes("@") ? searchQuery.split("@")[0] : searchQuery,
        balance: 47,
        plan: "Free",
        rateLimit: "Normal",
      });
      setIsSearching(false);
    }, 600);
  };

  const handleCreditAction = (type: "add" | "remove" | "bonus") => {
    const amt = parseInt(creditAmount);
    if (!amt || amt <= 0 || !selectedUser) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" });
      return;
    }
    const labels = { add: "Added credits", remove: "Removed credits", bonus: "Granted bonus credits" };
    logAction(labels[type], selectedUser.email, amt);
    setSelectedUser((prev) => prev ? { ...prev, balance: type === "remove" ? Math.max(0, prev.balance - amt) : prev.balance + amt } : null);
    setCreditAmount("");
    toast({ title: "Pending backend wiring", description: `${labels[type]}: ${amt} for ${selectedUser.email}` });
  };

  const handleSetCap = () => {
    if (!selectedUser) return;
    logAction("Set daily token cap", selectedUser.email);
    toast({ title: "Pending backend wiring", description: "Token cap update queued." });
  };

  const handleResetRateLimit = () => {
    if (!selectedUser) return;
    logAction("Reset rate-limit flags", selectedUser.email);
    setSelectedUser((prev) => prev ? { ...prev, rateLimit: "Normal" } : null);
    toast({ title: "Pending backend wiring", description: "Rate limit flags reset." });
  };

  const handleGrantCredits = async () => {
    if (!grantEmail.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    const amt = parseInt(grantAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a positive amount", variant: "destructive" });
      return;
    }
    setIsGranting(true);
    try {
      const { error } = await supabase.rpc("admin_grant_credits_by_email", {
        p_email: grantEmail.trim(),
        p_amount: amt,
        p_note: grantNote.trim() || null,
      });
      if (error) throw error;
      logAction("Granted credits", grantEmail.trim(), amt);
      toast({ title: "Credits granted", description: `${amt} credits → ${grantEmail.trim()}` });
      setGrantEmail("");
      setGrantAmount("");
      setGrantNote("");
      setGrantOpen(false);
    } catch (err: any) {
      toast({ title: "Grant failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <AdaGlassModule title="Credits & Billing Controls" icon={CreditCard}>
      {/* Top bar: Search + Grant button */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by email, username, or user ID..."
            className="w-full pl-9 pr-3 py-2 rounded-md text-xs bg-[hsl(var(--admin-surface-elevated)/0.4)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] outline-none focus:border-[hsl(25,85%,45%/0.5)]"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 rounded-md text-xs font-medium bg-[hsl(25,85%,45%/0.15)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.25)] hover:bg-[hsl(25,85%,45%/0.25)] transition-colors disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>

        {/* Grant Credits Modal */}
        <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[hsl(160,84%,39%/0.15)] text-[hsl(160,84%,39%)] border border-[hsl(160,84%,39%/0.25)] hover:bg-[hsl(160,84%,39%/0.25)] transition-colors">
              <Gift className="h-3.5 w-3.5" /> Grant Credits
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Grant Credits by Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User Email</label>
                <input
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-md text-sm bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  className="w-full px-3 py-2 rounded-md text-sm bg-muted/50 border border-border text-foreground outline-none focus:border-accent"
                />
                <div className="flex gap-1.5 mt-2">
                  {BONUS_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setGrantAmount(String(p))}
                      className="px-3 py-1 rounded text-xs font-medium border border-border text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                    >
                      +{p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
                <input
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="e.g. Beta tester bonus"
                  className="w-full px-3 py-2 rounded-md text-sm bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={handleGrantCredits}
                disabled={isGranting}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isGranting ? "Granting..." : "Grant Credits"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Info */}
          <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[hsl(var(--admin-text))]">User Profile</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(25,85%,45%/0.1)] text-[hsl(25,85%,45%)] font-medium">{selectedUser.plan}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-[hsl(var(--admin-text-muted))]">Email</span><span className="text-[hsl(var(--admin-text))]">{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-[hsl(var(--admin-text-muted))]">Username</span><span className="text-[hsl(var(--admin-text))]">@{selectedUser.username}</span></div>
              <div className="flex justify-between"><span className="text-[hsl(var(--admin-text-muted))]">Balance</span><span className="text-[hsl(var(--admin-text))] font-bold text-base">{selectedUser.balance} credits</span></div>
              <div className="flex justify-between"><span className="text-[hsl(var(--admin-text-muted))]">Rate Limit</span>
                <span className={`font-medium ${selectedUser.rateLimit === "Normal" ? "text-[hsl(160,84%,39%)]" : "text-[hsl(0,72%,51%)]"}`}>{selectedUser.rateLimit}</span>
              </div>
            </div>

            {/* Credit Actions */}
            <div className="pt-2 border-t border-[hsl(var(--admin-border)/0.2)]">
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Amount"
                  min="1"
                  className="flex-1 px-2 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface)/0.5)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => handleCreditAction("add")} className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium bg-[hsl(160,84%,39%/0.1)] text-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,39%/0.2)] transition-colors">
                  <Plus className="h-3 w-3" /> Add
                </button>
                <button onClick={() => handleCreditAction("remove")} className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,51%/0.2)] transition-colors">
                  <Minus className="h-3 w-3" /> Remove
                </button>
                <button onClick={() => handleCreditAction("bonus")} className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium bg-[hsl(25,85%,45%/0.1)] text-[hsl(25,85%,45%)] hover:bg-[hsl(25,85%,45%/0.2)] transition-colors">
                  <Gift className="h-3 w-3" /> Bonus
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <button onClick={handleSetCap} className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
                  <Clock className="h-3 w-3" /> Set Cap
                </button>
                <button onClick={handleResetRateLimit} className="flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
                  <RotateCcw className="h-3 w-3" /> Reset Limits
                </button>
              </div>
            </div>
          </div>

          {/* Recent Admin Actions */}
          <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-4">
            <span className="text-xs font-medium text-[hsl(var(--admin-text))] block mb-2">Recent Admin Actions</span>
            {actionLog.length === 0 ? (
              <p className="text-[10px] text-[hsl(var(--admin-text-muted))] py-4 text-center">No actions yet</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {actionLog.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[10px] py-1 border-b border-[hsl(var(--admin-border)/0.1)]">
                    <span className="text-[hsl(var(--admin-text-muted))] shrink-0">{a.timestamp}</span>
                    <span className="text-[hsl(var(--admin-text))] flex-1 truncate">{a.action} → {a.target}{a.amount ? ` (${a.amount})` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedUser && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-[hsl(var(--admin-text-muted))] mx-auto mb-2 opacity-30" />
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Search for a user to manage credits and billing</p>
          </div>
        </div>
      )}
    </AdaGlassModule>
  );
}
