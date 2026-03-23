import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ImageIcon, Camera, MapPin, Contact, File, BarChart3, Calendar, Wand2 } from "lucide-react";
import { toast } from "sonner";

const MEDIA_ACTIONS = [
  { icon: ImageIcon, label: "Photos", action: "photos" },
  { icon: Camera, label: "Camera", action: "camera" },
  { icon: MapPin, label: "Location", action: "location" },
  { icon: Contact, label: "Contact", action: "contact" },
  { icon: File, label: "Files", action: "document" },
  { icon: BarChart3, label: "Poll", action: "poll" },
  { icon: Calendar, label: "Event", action: "event" },
  { icon: Wand2, label: "AI images", action: "ai_images" },
];

interface ChatBusinessActionsProps {
  onPhotos?: () => void;
  onCamera?: () => void;
  onDocument?: () => void;
  onLocation?: () => void;
}

export function ChatBusinessActions({ onPhotos, onCamera, onDocument, onLocation }: ChatBusinessActionsProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleMediaAction = (action: string) => {
    setOpen(false);
    switch (action) {
      case "photos": onPhotos?.(); break;
      case "camera": onCamera?.(); break;
      case "document": onDocument?.(); break;
      case "location": onLocation?.(); break;
      case "contact": toast.info("Contact sharing coming soon"); break;
      case "poll": toast.info("Polls coming soon"); break;
      case "event": toast.info("Event sharing coming soon"); break;
      case "ai_images": navigate("/dashboard/ada"); break;
      default: break;
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded hover:opacity-80 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center text-muted-foreground"
        title="Attachments">
        <Plus className="w-4 h-4" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      <div
        className="absolute bottom-full left-0 mb-2 rounded-xl py-2 min-w-[220px] z-30 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        style={{ background: "#1a2027", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-3 pb-1.5 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attachments</span>
          <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Media grid */}
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {MEDIA_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => handleMediaAction(a.action)}
              className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <a.icon className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <span className="text-[9px] text-muted-foreground leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
