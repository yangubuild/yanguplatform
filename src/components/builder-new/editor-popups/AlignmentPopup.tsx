import { AlignLeft, AlignCenter, AlignRight, AlignJustify, X } from "lucide-react";

interface AlignmentPopupProps {
  onClose: () => void;
  onApply: (align: string) => void;
}

const ALIGNS = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
  { value: "justify", icon: AlignJustify },
];

export function AlignmentPopup({ onClose, onApply }: AlignmentPopupProps) {
  return (
    <div className="bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden p-3 w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Alignment</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
        {ALIGNS.map(a => (
          <button
            key={a.value}
            onClick={() => onApply(a.value)}
            className="flex-1 flex items-center justify-center py-2 rounded-md hover:bg-background transition-colors"
            title={a.value}
          >
            <a.icon className="h-4 w-4 text-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
