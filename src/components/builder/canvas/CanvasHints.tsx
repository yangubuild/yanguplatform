import { useState, useEffect } from "react";
import { X } from "lucide-react";

const HINTS_KEY = "yangu_canvas_hints_dismissed";

export function CanvasHints() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(HINTS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(HINTS_KEY, "true");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-foreground text-background rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="text-sm">✏️</span> Click text to edit
          </span>
          <span className="w-px h-4 bg-background/20" />
          <span className="flex items-center gap-1.5">
            <span className="text-sm">🖼</span> Click images to replace
          </span>
          <span className="w-px h-4 bg-background/20" />
          <span className="flex items-center gap-1.5">
            <span className="text-sm">🗑</span> Hover sections to manage
          </span>
        </div>
        <button
          onClick={dismiss}
          className="p-0.5 rounded hover:bg-background/20 transition-colors ml-2"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
