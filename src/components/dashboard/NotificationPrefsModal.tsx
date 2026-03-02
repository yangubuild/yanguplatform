import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const NOTIFICATION_ITEMS = [
  { name: "Livestreaming", sub: "Livestreaming", emoji: "🔴" },
  { name: "Public forum", sub: "Forums", emoji: "📋" },
  { name: "Content", sub: "Content", emoji: "💬" },
  { name: "Courses", sub: "Courses", emoji: "🎓" },
  { name: "Chat", sub: "Chat", emoji: "💬" },
];

interface NotificationPrefsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPrefsModal({ open, onOpenChange }: NotificationPrefsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 border-0 gap-0"
        style={{ background: "#1a2129", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-bold text-white">Notification preferences</DialogTitle>
        </div>

        <div className="px-4 pb-6 space-y-2">
          {NOTIFICATION_ITEMS.map((item) => (
            <button
              key={item.name}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:bg-white/[0.03]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {item.emoji}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.sub}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
