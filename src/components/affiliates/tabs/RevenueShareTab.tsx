import { useState } from "react";
import { BarChart3, ChevronRight, Rocket, X, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import { createPortal } from "react-dom";

export function RevenueShareTab() {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <div className="max-w-[700px]">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue share partners</h3>

      <div className="rounded-xl border border-white/[0.04] mb-6" style={{ background: "#111a15" }}>
        <button
          onClick={() => setShowDrawer(true)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Share your revenue</p>
            <p className="text-xs text-white/40 mt-0.5">Automatically pay partners a percentage of all sales</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
        </button>
      </div>

      <AffEmptyTable
        columns={["User", "Product", "Earned", "Share", "Payout type"]}
        icon={<Rocket className="w-8 h-8 text-white/20" />}
        title="No revenue share partners yet"
        subtitle="Revenue share partners will appear here once you add them."
      />

      {showDrawer && <ShareRevenueDrawer onClose={() => setShowDrawer(false)} />}
    </div>
  );
}

function ShareRevenueDrawer({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState("");
  const [shareType, setShareType] = useState("Post fee");
  const [sharePercent, setSharePercent] = useState("0");

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full flex flex-col border-l border-white/[0.04]" style={{ background: "#111a15" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
          <h3 className="text-base font-semibold text-white">Share your revenue</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">User</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="user@example.com"
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/40"
            />
            <p className="text-[11px] text-white/30 mt-1">You can add users by their email, yangu username, or user ID.</p>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Share type ⓘ</label>
            <div className="relative">
              <select
                value={shareType}
                onChange={(e) => setShareType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white appearance-none focus:outline-none focus:border-accent/40"
              >
                <option value="Post fee">Post fee</option>
                <option value="Pre fee">Pre fee</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Share %</label>
            <div className="relative">
              <input
                value={sharePercent}
                onChange={(e) => setSharePercent(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-accent/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30">%</span>
            </div>
            <p className="text-[11px] text-white/30 mt-1">Partner receives this percentage of all sales</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-white/60">Products</label>
              <button className="text-xs text-accent font-medium">Select all</button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/[0.06] mb-2">
              <Search className="w-4 h-4 text-white/30" />
              <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search products" />
            </div>
            <div className="rounded-lg border border-white/[0.06] p-3 flex items-center gap-3">
              <input type="checkbox" className="rounded border-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">Budget-Friendly Meal Prep Kits</p>
              </div>
              <span className="text-xs text-white/40">$29.99 / month</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.04]">
          <Button
            variant="accent"
            className="w-full h-11"
          >
            Invite
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
