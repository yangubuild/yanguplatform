import { Radio, ImageOff, ShoppingCart, Megaphone, HeadphonesIcon, PauseCircle } from "lucide-react";
import { AdaGlassModule } from "./AdaGlassModule";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface OpsAction {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  variant: "warning" | "danger" | "info";
  activeLabel?: string;
}

const opsActions: OpsAction[] = [
  { id: "broadcast", label: "Broadcast Announcement", icon: Megaphone, description: "Send a system-wide banner to all users", variant: "info" },
  { id: "pause-image", label: "Pause Image Generation", icon: ImageOff, description: "Globally disable image generation", variant: "danger", activeLabel: "Image Gen Paused" },
  { id: "pause-shopping", label: "Pause Shopping Actions", icon: ShoppingCart, description: "Globally disable shopping AI actions", variant: "danger", activeLabel: "Shopping Paused" },
  { id: "escalation-queue", label: "Support Escalation Queue", icon: HeadphonesIcon, description: "Route to support escalation queue", variant: "warning" },
];

const variantStyles = {
  warning: { bg: "bg-[hsl(38,92%,50%/0.1)]", border: "border-[hsl(38,92%,50%/0.25)]", text: "text-[hsl(38,92%,50%)]", hover: "hover:bg-[hsl(38,92%,50%/0.2)]" },
  danger: { bg: "bg-[hsl(0,72%,51%/0.1)]", border: "border-[hsl(0,72%,51%/0.25)]", text: "text-[hsl(0,72%,51%)]", hover: "hover:bg-[hsl(0,72%,51%/0.2)]" },
  info: { bg: "bg-[hsl(217,91%,60%/0.1)]", border: "border-[hsl(217,91%,60%/0.25)]", text: "text-[hsl(217,91%,60%)]", hover: "hover:bg-[hsl(217,91%,60%/0.2)]" },
};

export function LiveOpsPanel() {
  const [activeOps, setActiveOps] = useState<Set<string>>(new Set());
  const [broadcastText, setBroadcastText] = useState("");

  const handleAction = (id: string) => {
    if (id === "broadcast") {
      if (!broadcastText.trim()) {
        toast({ title: "Enter announcement text", variant: "destructive" });
        return;
      }
      toast({ title: "Broadcast Queued", description: `"${broadcastText}" — Pending backend wiring` });
      setBroadcastText("");
      return;
    }
    if (id === "escalation-queue") {
      toast({ title: "Escalation Queue", description: "Opening support queue — Pending backend wiring" });
      return;
    }
    // Toggle pause states
    setActiveOps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Resumed", description: `${id} reactivated. Pending backend wiring` });
      } else {
        next.add(id);
        toast({ title: "Paused", description: `${id} paused globally. Pending backend wiring` });
      }
      return next;
    });
  };

  return (
    <AdaGlassModule title="Live Ops Controls" icon={Radio}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opsActions.map((action) => {
          const Icon = action.icon;
          const v = variantStyles[action.variant];
          const isActive = activeOps.has(action.id);
          return (
            <div key={action.id} className="space-y-2">
              <button
                onClick={() => handleAction(action.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors ${v.bg} ${v.border} ${v.hover}`}>
                {isActive ? <PauseCircle className={`h-5 w-5 ${v.text}`} /> : <Icon className={`h-5 w-5 ${v.text}`} />}
                <div className="text-left flex-1">
                  <span className={`text-xs font-medium ${v.text}`}>
                    {isActive && action.activeLabel ? action.activeLabel : action.label}
                  </span>
                  <p className="text-[10px] text-[hsl(var(--admin-text-muted))] mt-0.5">{action.description}</p>
                </div>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(0,72%,51%/0.15)] text-[hsl(0,72%,51%)] font-medium animate-pulse">ACTIVE</span>
                )}
              </button>
              {action.id === "broadcast" && (
                <input
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Type announcement text..."
                  className="w-full px-3 py-1.5 rounded text-xs bg-[hsl(var(--admin-surface-elevated)/0.4)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))] outline-none focus:border-[hsl(217,91%,60%/0.5)]"
                />
              )}
            </div>
          );
        })}
      </div>
    </AdaGlassModule>
  );
}