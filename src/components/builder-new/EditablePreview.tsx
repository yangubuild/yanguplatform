import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Image, Trash2, Plus, Palette, ArrowUp, ArrowDown, Type } from "lucide-react";
import { toast } from "sonner";
import { EditorImagePickerDialog } from "./EditorImagePickerDialog";
import { EditorColorPickerDialog } from "./EditorColorPickerDialog";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
}

export function EditablePreview({ html, onHtmlChange }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Inject editable script into iframe
  const getEditableHtml = useCallback((baseHtml: string, editable: boolean) => {
    if (!editable) return baseHtml;
    
    // Inject contenteditable + click handlers + section selection
    const editScript = `
      <style>
        [contenteditable]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; cursor: text; }
        [contenteditable]:focus { outline: 2px solid #22c55e; outline-offset: 2px; }
        .section-hover { position: relative; }
        .section-hover:hover { outline: 2px dashed #22c55e44; outline-offset: -2px; border-radius: 8px; }
        .section-selected { outline: 2px solid #22c55e !important; outline-offset: -2px; border-radius: 8px; }
        img:hover { outline: 2px solid #3b82f644; cursor: pointer; }
        .yangu-img-selected { outline: 2px solid #3b82f6 !important; }
      </style>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Make text elements editable
          document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,button').forEach(function(el) {
            if (el.children.length === 0 || el.tagName === 'A' || el.tagName === 'BUTTON') {
              el.setAttribute('contenteditable', 'true');
              el.addEventListener('blur', function() {
                window.parent.postMessage({ type: 'html-update', html: document.documentElement.outerHTML }, '*');
              });
            }
          });
          // Section click for selection
          document.querySelectorAll('section, footer, nav').forEach(function(el, idx) {
            el.classList.add('section-hover');
            el.dataset.sectionIdx = idx;
            el.addEventListener('click', function(e) {
              document.querySelectorAll('.section-selected').forEach(function(s) { s.classList.remove('section-selected'); });
              el.classList.add('section-selected');
              window.parent.postMessage({ type: 'section-select', idx: idx, tag: el.tagName }, '*');
            });
          });
          // Image click
          document.querySelectorAll('img').forEach(function(el) {
            el.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              document.querySelectorAll('.yangu-img-selected').forEach(function(s) { s.classList.remove('yangu-img-selected'); });
              el.classList.add('yangu-img-selected');
              window.parent.postMessage({ type: 'image-click', src: el.src }, '*');
            });
          });
        }
        );
      </script>
    `;
    
    return baseHtml.replace('</head>', editScript + '</head>');
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'html-update') {
        onHtmlChange(e.data.html);
      }
      if (e.data?.type === 'section-select') {
        setSelectedSection(e.data.idx?.toString() || null);
      }
      if (e.data?.type === 'image-click') {
        handleReplaceImage(e.data.src);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHtmlChange, html]);

  // ─── Toolbar actions ──────────────────────────────────────────

  const getDoc = useCallback(() => iframeRef.current?.contentDocument, []);

  const pushHtmlUpdate = useCallback(() => {
    const doc = getDoc();
    if (doc) onHtmlChange(doc.documentElement.outerHTML);
  }, [getDoc, onHtmlChange]);

  const handleReplaceImage = useCallback((currentSrc?: string) => {
    const url = prompt("Paste the new image URL:", currentSrc || "");
    if (!url) return;
    const doc = getDoc();
    if (!doc) return;
    if (currentSrc) {
      const img = doc.querySelector(`img[src="${CSS.escape(currentSrc)}"]`) as HTMLImageElement | null;
      if (img) { img.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); return; }
    }
    // Replace the selected img
    const sel = doc.querySelector('.yangu-img-selected') as HTMLImageElement | null;
    if (sel) { sel.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); } else { toast.info("Click an image first, then replace."); }
  }, [getDoc, pushHtmlUpdate]);

  const handleAddSection = useCallback(() => {
    const doc = getDoc();
    if (!doc) return;
    const newSection = doc.createElement("section");
    newSection.style.cssText = "padding:72px 24px;text-align:center;";
    newSection.innerHTML = `<div style="max-width:900px;margin:0 auto;"><h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;">New Section</h2><p style="color:#666;">Click to edit this section content.</p></div>`;
    const footer = doc.querySelector("footer");
    if (footer) { footer.parentElement?.insertBefore(newSection, footer); } else { doc.body.appendChild(newSection); }
    pushHtmlUpdate();
    toast.success("Section added!");
  }, [getDoc, pushHtmlUpdate]);

  const handleChangeStyle = useCallback(() => {
    const color = prompt("Enter a new accent color (hex):", "#F97316");
    if (!color) return;
    const doc = getDoc();
    if (!doc) return;
    // Replace accent color in all inline styles
    const allEls = doc.querySelectorAll("[style]");
    allEls.forEach(el => {
      const s = (el as HTMLElement).style;
      if (s.backgroundColor && (s.backgroundColor.includes("rgb") || s.backgroundColor.startsWith("#"))) {
        // Only change accent-colored elements (buttons, badges)
        const tag = el.tagName;
        if (tag === "A" || tag === "BUTTON" || tag === "SPAN") {
          s.backgroundColor = color;
        }
      }
    });
    pushHtmlUpdate();
    toast.success("Style updated!");
  }, [getDoc, pushHtmlUpdate]);

  const getSectionElements = useCallback(() => {
    const doc = getDoc();
    if (!doc) return [];
    return Array.from(doc.querySelectorAll("section"));
  }, [getDoc]);

  const handleMoveUp = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const sections = getSectionElements();
    const idx = parseInt(selectedSection);
    // Find the actual section element
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav"));
    const el = allSections[idx];
    if (!el || !el.previousElementSibling || el.previousElementSibling.tagName === "NAV") { toast.info("Can't move further up."); return; }
    el.parentElement?.insertBefore(el, el.previousElementSibling);
    pushHtmlUpdate();
    toast.success("Section moved up!");
  }, [selectedSection, getSectionElements, getDoc, pushHtmlUpdate]);

  const handleMoveDown = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || !el.nextElementSibling) { toast.info("Can't move further down."); return; }
    el.parentElement?.insertBefore(el.nextElementSibling, el);
    pushHtmlUpdate();
    toast.success("Section moved down!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

  const handleRemove = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || el.tagName === "NAV") { toast.info("Can't remove navigation."); return; }
    if (!confirm("Remove this section?")) return;
    el.remove();
    setSelectedSection(null);
    pushHtmlUpdate();
    toast.success("Section removed!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

  const processedHtml = getEditableHtml(html, editMode);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Your Website Draft</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ToolButton icon={Type} label="Edit Text" active={editMode} onClick={() => setEditMode(!editMode)} />
          <ToolButton icon={Image} label="Replace Image" onClick={() => handleReplaceImage()} />
          <ToolButton icon={Plus} label="Add Section" onClick={handleAddSection} />
          <ToolButton icon={Palette} label="Change Style" onClick={handleChangeStyle} />
          <ToolButton icon={ArrowUp} label="Move Up" onClick={handleMoveUp} />
          <ToolButton icon={ArrowDown} label="Move Down" onClick={handleMoveDown} />
          <ToolButton icon={Trash2} label="Remove" onClick={handleRemove} />
        </div>
      </div>

      {editMode && (
        <div className="px-3 py-1.5 bg-primary/5 border-b border-primary/20 text-[11px] text-primary">
          Click any text to edit it directly. Changes save automatically.
        </div>
      )}

      {/* Preview iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={processedHtml}
        className="flex-1 w-full bg-white border-0"
        title="Editable Website Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

const ToolButton = forwardRef<HTMLButtonElement, { icon: any; label: string; active?: boolean; onClick: () => void }>(function ToolButton({ icon: Icon, label, active, onClick }, ref) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
});
