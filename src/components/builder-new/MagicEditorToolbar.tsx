import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Link2, Bold, Italic, Underline, Strikethrough,
  AlignCenter, Type as TypeIcon, LayoutGrid, Image as ImageIcon,
  Replace, Palette, Trash2, Copy, MousePointer, Plus,
} from "lucide-react";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";
import type { ActivePopup, SelectedScope, LinkData } from "./editor-popups/EditorPopupTypes";
import type { AdaChatMessage } from "./ada/useAdaBuilderChat";
import { LinkPopup } from "./editor-popups/LinkPopup";
import { AdaPopup } from "./editor-popups/AdaPopup";
import { TypographyPopup } from "./editor-popups/TypographyPopup";
import { AlignmentPopup } from "./editor-popups/AlignmentPopup";
import { ColorPopup } from "./editor-popups/ColorPopup";

interface MagicEditorToolbarProps {
  selection: CanvasSelection;
  onAction: (action: string, payload?: any) => void;
  position?: { top: number; left: number };
  /** Current color of the selected element, read from iframe */
  currentColor?: string;
  /** Shared ADA chat state — enables unified assistant */
  adaMessages?: AdaChatMessage[];
  adaIsLoading?: boolean;
  onAdaSend?: (text: string) => void;
}

function mapKindToScope(kind: string): SelectedScope {
  if (kind === "text") return "text";
  if (kind === "button") return "button";
  if (kind === "image") return "image";
  if (kind === "section") return "section";
  if (kind === "card") return "text"; // fallback scope for popups
  if (kind === "page") return "page";
  return "none";
}

export function MagicEditorToolbar({ selection, onAction, currentColor, adaMessages, adaIsLoading, onAdaSend }: MagicEditorToolbarProps) {
  const kind = selection.kind;
  const scope = mapKindToScope(kind);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when selection target changes (e.g. clicking in iframe)
  const prevNodeRef = useRef(selection.nodeId);
  useEffect(() => {
    if (selection.nodeId !== prevNodeRef.current) {
      setActivePopup(null);
      prevNodeRef.current = selection.nodeId;
    }
  }, [selection.nodeId]);

  // Close popups on outside click
  useEffect(() => {
    if (!activePopup) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopup(null);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [activePopup]);

  // Close on escape
  useEffect(() => {
    if (!activePopup) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePopup(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activePopup]);

  const togglePopup = (p: ActivePopup) => setActivePopup(prev => prev === p ? null : p);

  const getColorLabel = () => {
    if (kind === "text") return "Text Color";
    if (kind === "button") return "Button Color";
    if (kind === "section") return "Section BG";
    return "Page BG";
  };

  const handleColorApply = useCallback((color: string) => {
    if (kind === "text") {
      onAction("set_text_style", { color });
    } else if (kind === "button") {
      onAction("set_button_color", { color });
    } else if (kind === "section") {
      onAction("set_section_style", { backgroundColor: color });
    } else if (kind === "page" || kind === "card") {
      onAction("set_page_bg_color", { color });
    }
    setActivePopup(null);
  }, [kind, onAction]);

  const handleLinkApply = useCallback((data: LinkData) => {
    onAction("set_link", data);
    setActivePopup(null);
  }, [onAction]);

  const handleAlignApply = useCallback((align: string) => {
    onAction("set_text_style", { textAlign: align });
    setActivePopup(null);
  }, [onAction]);

  const handleTypographyApply = useCallback((style: Record<string, string>) => {
    onAction("set_text_style", style);
  }, [onAction]);

  const handleAdaPrompt = useCallback((prompt: string) => {
    if (onAdaSend) {
      onAdaSend(prompt);
    } else {
      onAction("ada_prompt", { prompt, scope });
    }
  }, [onAction, onAdaSend, scope]);

  const dotColor = currentColor || undefined;

  return (
    <div ref={containerRef} className="relative">
      {/* Main bar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-foreground/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        {/* Ask Ada — ALWAYS FIRST */}
        <MagicBtn
          icon={Sparkles}
          label="Ask Ada"
          onClick={() => togglePopup("ada")}
          active={activePopup === "ada"}
        />

        <div className="w-px h-4 bg-background/20 mx-0.5" />

        {/* === TEXT CONTEXT === */}
        {kind === "text" && (
          <>
            <MagicBtn icon={Link2} label="Link" onClick={() => togglePopup("link")} active={activePopup === "link"} />
            <ColorDot
              onClick={() => togglePopup("color")}
              active={activePopup === "color"}
              color={dotColor}
            />
            <MagicBtn icon={Bold} label="Bold" onClick={() => onAction("set_text_style", { fontWeight: "700" })} />
            <MagicBtn icon={Italic} label="Italic" onClick={() => onAction("set_text_style", { fontStyle: "italic" })} />
            <MagicBtn icon={Underline} label="Underline" onClick={() => onAction("set_text_style", { textDecoration: "underline" })} />
            <MagicBtn icon={Strikethrough} label="Strike" onClick={() => onAction("set_text_style", { textDecoration: "line-through" })} />
            <div className="w-px h-4 bg-background/20 mx-0.5" />
            <MagicBtn icon={TypeIcon} label="Font" onClick={() => togglePopup("typography")} active={activePopup === "typography"} />
            <MagicBtn icon={AlignCenter} label="Align" onClick={() => togglePopup("alignment")} active={activePopup === "alignment"} />
            {selection.sectionIndex >= 0 && (
              <>
                <div className="w-px h-4 bg-background/20 mx-0.5" />
                <MagicBtn icon={ImageIcon} label="Section BG" onClick={() => onAction("set_section_bg_image")} />
              </>
            )}
          </>
        )}

        {/* === BUTTON CONTEXT === */}
        {kind === "button" && (
          <>
            <MagicBtn icon={Link2} label="Link" onClick={() => togglePopup("link")} active={activePopup === "link"} />
            <ColorDot
              onClick={() => togglePopup("color")}
              active={activePopup === "color"}
              color={dotColor}
            />
            <MagicBtn icon={TypeIcon} label="Font" onClick={() => togglePopup("typography")} active={activePopup === "typography"} />
            <MagicBtn icon={AlignCenter} label="Align" onClick={() => togglePopup("alignment")} active={activePopup === "alignment"} />
            {selection.sectionIndex >= 0 && (
              <>
                <div className="w-px h-4 bg-background/20 mx-0.5" />
                <MagicBtn icon={ImageIcon} label="Section BG" onClick={() => onAction("set_section_bg_image")} />
              </>
            )}
          </>
        )}

        {/* === IMAGE CONTEXT === */}
        {kind === "image" && (
          <>
            <MagicBtn icon={Replace} label="Replace" onClick={() => onAction("replace_image")} />
            <MagicBtn icon={ImageIcon} label="Stock" onClick={() => onAction("stock_image")} />
          </>
        )}

        {/* === SECTION CONTEXT === */}
        {kind === "section" && (
          <>
            <ColorDot
              onClick={() => togglePopup("color")}
              active={activePopup === "color"}
              color={dotColor}
            />
            <MagicBtn icon={LayoutGrid} label="Layout" onClick={() => onAction("change_layout")} />
            <MagicBtn icon={ImageIcon} label="Replace BG" onClick={() => onAction("set_section_bg_image")} />
            <MagicBtn icon={Plus} label="Add CTA" onClick={() => onAction("add_cta_button")} />
            <div className="w-px h-4 bg-background/20 mx-0.5" />
            <MagicBtn icon={Copy} label="Duplicate" onClick={() => onAction("duplicate_section")} />
            <MagicBtn icon={Trash2} label="Delete" onClick={() => onAction("remove_section")} />
          </>
        )}

        {/* === PAGE CONTEXT === */}
        {kind === "page" && (
          <>
            <ColorDot
              onClick={() => togglePopup("color")}
              active={activePopup === "color"}
              color={dotColor}
            />
          </>
        )}

        {/* === CARD CONTEXT === */}
        {kind === "card" && (
          <>
            <MagicBtn icon={TypeIcon} label="Edit" onClick={() => onAction("edit_text")} />
            <MagicBtn icon={ImageIcon} label="Image" onClick={() => onAction("replace_image")} />
            <MagicBtn icon={Plus} label="Order Btn" onClick={() => onAction("add_card_order_button")} />
            <ColorDot
              onClick={() => togglePopup("color")}
              active={activePopup === "color"}
              color={dotColor}
            />
            <div className="w-px h-4 bg-background/20 mx-0.5" />
            <MagicBtn icon={Copy} label="Duplicate" onClick={() => onAction("duplicate_element")} />
            <MagicBtn icon={Trash2} label="Delete" onClick={() => onAction("delete_element")} />
          </>
        )}
      </div>

      {/* Popups — positioned above the bar */}
      {activePopup && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          {activePopup === "link" && (
            <LinkPopup onClose={() => setActivePopup(null)} onApply={handleLinkApply} />
          )}
          {activePopup === "ada" && (
            <AdaPopup onClose={() => setActivePopup(null)} selectedScope={scope} onSendPrompt={handleAdaPrompt} messages={adaMessages} isLoading={adaIsLoading} />
          )}
          {activePopup === "typography" && (
            <TypographyPopup onClose={() => setActivePopup(null)} onApply={handleTypographyApply} />
          )}
          {activePopup === "alignment" && (
            <AlignmentPopup onClose={() => setActivePopup(null)} onApply={handleAlignApply} />
          )}
          {activePopup === "color" && (
            <ColorPopup
              onClose={() => setActivePopup(null)}
              onApply={handleColorApply}
              currentColor={currentColor}
              label={getColorLabel()}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MagicBtn({ icon: Icon, label, onClick, active }: { icon: any; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-background/30 text-background"
          : "text-background hover:bg-background/20"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ColorDot({ onClick, active, color }: { onClick: () => void; active?: boolean; color?: string }) {
  return (
    <button
      onClick={onClick}
      title="Color"
      className={`p-1 rounded-md transition-colors ${active ? "bg-background/30" : "hover:bg-background/20"}`}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-background/50"
        style={{ backgroundColor: color || "hsl(var(--primary))" }}
      />
    </button>
  );
}
