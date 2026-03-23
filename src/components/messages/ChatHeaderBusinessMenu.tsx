import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Tag, Megaphone, Compass, Globe, Sparkles, X } from "lucide-react";
import { CreateTrendModal } from "@/components/messages/CreateTrendModal";

const BUSINESS_ACTIONS = [
  { icon: FileText, label: "Create Post", route: "/dashboard/home?action=new_post" },
  { icon: Tag, label: "Create Offer", route: "/dashboard/offers?action=new_offer" },
  { icon: Megaphone, label: "Create Ad", route: "/dashboard/ads?action=new_ad" },
  { icon: Compass, label: "Add to Explore", route: "/dashboard/explore" },
  { icon: Globe, label: "Add to Global Chat", route: "/dashboard/messages?tab=global" },
];

export function ChatHeaderBusinessMenu() {
  const [open, setOpen] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
        title="Business actions">
        <Briefcase className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-40 rounded-xl py-1.5 min-w-[200px] shadow-2xl"
            style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-3 pb-1.5 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Business Actions</span>
              <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
            {BUSINESS_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => { navigate(a.route); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                <a.icon className="w-3.5 h-3.5 text-muted-foreground" />
                {a.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="mt-1 pt-1">
              <button
                onClick={() => { setShowTrendModal(true); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                style={{ color: "#f59e0b" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Create Trend
              </button>
            </div>
          </div>
        </>
      )}

      {showTrendModal && <CreateTrendModal onClose={() => setShowTrendModal(false)} />}
    </div>
  );
}
