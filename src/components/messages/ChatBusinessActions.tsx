import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Tag, Megaphone, Compass, Globe, X } from "lucide-react";

const ACTIONS = [
  { icon: FileText, label: "Create Post", route: "/dashboard/home?action=new_post" },
  { icon: Tag, label: "Create Offer", route: "/dashboard/offers?action=new_offer" },
  { icon: Megaphone, label: "Create Ad", route: "/dashboard/ads?action=new_ad" },
  { icon: Compass, label: "Add to Explore", route: "/dashboard/explore" },
  { icon: Globe, label: "Add to Global Chat", route: "/dashboard/messages?tab=global" },
];

export function ChatBusinessActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded hover:opacity-80 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center text-muted-foreground"
        title="Business actions">
        <Plus className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-full left-0 mb-2 rounded-xl py-2 min-w-[200px] z-30 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between px-3 pb-1.5 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</span>
        <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="w-3 h-3" />
        </button>
      </div>
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => { navigate(a.route); setOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
          <a.icon className="w-3.5 h-3.5 text-muted-foreground" />
          {a.label}
        </button>
      ))}
    </div>
  );
}
