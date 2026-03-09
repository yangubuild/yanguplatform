import { useState } from "react";
import { Link2, ClipboardList, Search, Rocket } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import { toast } from "sonner";

export function AffiliatePortalTab() {
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/affiliate-portal`);
    toast.success("Portal link copied!");
  };

  return (
    <div className="max-w-[700px]">
      <h3 className="text-lg font-semibold text-white mb-4">Affiliate setup</h3>

      <div className="rounded-xl border border-white/[0.04] divide-y divide-white/[0.04] mb-8" style={{ background: "#111a15" }}>
        {/* Portal link */}
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Portal link</p>
            <p className="text-xs text-white/40 mt-0.5">Give your affiliates a place to organize their resources</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            Copy link
          </button>
        </div>

        {/* Waitlist */}
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Waitlist</p>
            <p className="text-xs text-white/40 mt-0.5">Set up a waitlist for your affiliates program</p>
          </div>
          <Switch checked={waitlistEnabled} onCheckedChange={setWaitlistEnabled} />
        </div>
      </div>

      <div className="border-t border-white/[0.04] my-6" />

      <h3 className="text-lg font-semibold text-white mb-4">Affiliate management</h3>

      <div className="flex items-center gap-3 mb-4">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 border border-white/[0.06]">
          Status: <span className="text-white font-medium">{statusFilter}</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] flex-1">
          <Search className="w-4 h-4 text-white/30" />
          <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
        </div>
      </div>

      <AffEmptyTable
        columns={["User", "Date", "Status", "Actions"]}
        icon={<Rocket className="w-8 h-8 text-white/20" />}
        title="No pending applications"
      />
    </div>
  );
}
