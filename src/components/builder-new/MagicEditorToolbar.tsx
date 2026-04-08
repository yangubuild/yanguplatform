import { Type, Image as ImageIcon, Palette, Replace, Bold, Italic, AlignCenter, Maximize } from "lucide-react";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";

interface MagicEditorToolbarProps {
  selection: CanvasSelection;
  onAction: (action: string, payload?: any) => void;
  position?: { top: number; left: number };
}

export function MagicEditorToolbar({ selection, onAction }: MagicEditorToolbarProps) {
  const kind = selection.kind;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-foreground/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      {kind === "text" && (
        <>
          <MagicBtn icon={Bold} label="Bold" onClick={() => onAction("set_text_style", { fontWeight: "700" })} />
          <MagicBtn icon={Italic} label="Italic" onClick={() => onAction("set_text_style", { fontStyle: "italic" })} />
          <MagicBtn icon={AlignCenter} label="Center" onClick={() => onAction("set_text_style", { textAlign: "center" })} />
          <MagicBtn icon={Maximize} label="Larger" onClick={() => onAction("set_text_style", { fontSize: "1.25rem" })} />
          <MagicBtn icon={Palette} label="Color" onClick={() => onAction("open_text_color")} />
          <div className="w-px h-4 bg-background/20 mx-0.5" />
          <MagicBtn icon={Palette} label="Page BG" onClick={() => onAction("set_page_bg")} />
        </>
      )}
      {kind === "image" && (
        <>
          <MagicBtn icon={Replace} label="Replace" onClick={() => onAction("replace_image")} />
          <MagicBtn icon={ImageIcon} label="Stock" onClick={() => onAction("stock_image")} />
        </>
      )}
      {kind === "button" && (
        <>
          <MagicBtn icon={Palette} label="Color" onClick={() => onAction("open_button_color")} />
          <MagicBtn icon={Maximize} label="Larger" onClick={() => onAction("set_button_size", { padding: "16px 32px", fontSize: "1.1rem" })} />
        </>
      )}
      {kind === "section" && (
        <>
          <MagicBtn icon={Palette} label="Section BG" onClick={() => onAction("change_colors")} />
          <MagicBtn icon={Palette} label="Page BG" onClick={() => onAction("set_page_bg")} />
          <MagicBtn icon={Type} label="Edit Text" onClick={() => onAction("edit_text")} />
        </>
      )}
      {kind === "card" && (
        <>
          <MagicBtn icon={Type} label="Edit" onClick={() => onAction("edit_text")} />
          <MagicBtn icon={ImageIcon} label="Image" onClick={() => onAction("replace_image")} />
        </>
      )}
    </div>
  );
}

function MagicBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-background hover:bg-background/20 transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
