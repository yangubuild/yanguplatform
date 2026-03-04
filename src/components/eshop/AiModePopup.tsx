import { X, TrendingUp, Users, Paintbrush, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: TrendingUp, title: "Market Trend Analysis", desc: "Spot rising products before they go viral" },
  { icon: Users, title: "Cross-Supplier Analysis", desc: "Compare prices across providers instantly" },
  { icon: Paintbrush, title: "Product Design", desc: "AI-assisted product listing creation" },
  { icon: MessageSquare, title: "Effective Communication", desc: "Generate supplier requirements automatically" },
];

interface Props {
  onClose: () => void;
  onTryAiMode?: () => void;
}

export default function AiModePopup({ onClose, onTryAiMode }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Meet Your AI Sourcing Agent: <span className="text-accent">AI Mode</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Spot market trends. Design faster. Find the best suppliers and communicate better.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5">
              <f.icon className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            if (onTryAiMode) {
              onTryAiMode();
              return;
            }
            onClose();
          }}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-semibold"
        >
          Try it now
        </Button>
      </div>
    </div>
  );
}
