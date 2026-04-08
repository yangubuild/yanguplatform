import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Image, Trash2, Plus, Palette, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { EditorImagePickerDialog } from "./EditorImagePickerDialog";
import { EditorColorPickerDialog } from "./EditorColorPickerDialog";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
  onSelectionChange?: (selection: CanvasSelection) => void;
  viewportMode?: "desktop" | "mobile";
}

export function EditablePreview({ html, onHtmlChange, onSelectionChange, viewportMode = "desktop" }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | undefined>(undefined);

  const getEditableHtml = useCallback((baseHtml: string) => {
    const editScript = `
      <style>
        [contenteditable]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; cursor: text; }
        [contenteditable]:focus { outline: 2px solid #22c55e; outline-offset: 2px; }
        .section-hover { position: relative; }
        .section-hover:hover { outline: 2px dashed #22c55e44; outline-offset: -2px; border-radius: 8px; }
        .section-selected { outline: 2px solid #22c55e !important; outline-offset: -2px; border-radius: 8px; }
        img:hover { outline: 2px solid #22c55e44; cursor: pointer; }
        .yangu-img-selected { outline: 2px solid #22c55e !important; }
        .yangu-el-selected { outline: 2px solid #22c55e !important; outline-offset: 2px; }
        button:hover, a[class*="btn"]:hover, a[class*="cta"]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; }
        .yangu-btn-selected { outline: 2px solid #22c55e !important; outline-offset: 2px; }
      </style>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Classify element for selection sync
          function classifyEl(el) {
            var t = el.tagName.toUpperCase();
            var cl = Array.from(el.classList || []);
            if (t === 'BUTTON' || (t === 'A' && cl.some(function(c) { return c.includes('btn') || c.includes('button') || c.includes('cta'); }))) return 'button';
            if (t === 'IMG') return 'image';
            if (['H1','H2','H3','H4','H5','H6','P','SPAN','LI','LABEL'].indexOf(t) !== -1) return 'text';
            if (t === 'A') return 'button';
            if (['SECTION','FOOTER','NAV','HEADER'].indexOf(t) !== -1) return 'section';
            if (t === 'DIV' && cl.some(function(c) { return c.includes('card') || c.includes('item') || c.includes('product') || c.includes('menu-item'); })) return 'card';
            return 'page';
          }

          function getPreview(el, kind) {
            if (kind === 'image') return el.src || '';
            if (kind === 'text' || kind === 'button') return (el.textContent || '').trim().substring(0, 60);
            if (kind === 'section') return el.id || el.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0,40) || '';
            return '';
          }

          function findSectionIndex(el) {
            var sections = document.querySelectorAll('section, footer, nav, header');
            var node = el;
            while (node && node !== document.body) {
              for (var i = 0; i < sections.length; i++) {
                if (sections[i] === node) return i;
              }
              node = node.parentElement;
            }
            return -1;
          }

          function clearAllHighlights() {
            document.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected').forEach(function(s) {
              s.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected');
            });
          }

          // Make text elements editable
          document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,button').forEach(function(el) {
            if (el.children.length === 0 || el.tagName === 'A' || el.tagName === 'BUTTON') {
              el.setAttribute('contenteditable', 'true');
              el.addEventListener('blur', function() {
                window.parent.postMessage({ type: 'html-update', html: document.documentElement.outerHTML }, '*');
              });
            }
          });

          // Section hover/selection
          document.querySelectorAll('section, footer, nav').forEach(function(el, idx) {
            el.classList.add('section-hover');
            el.dataset.sectionIdx = idx;
          });

          // Image click
          document.querySelectorAll('img').forEach(function(el) {
            el.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              clearAllHighlights();
              el.classList.add('yangu-img-selected');
              var si = findSectionIndex(el);
              window.parent.postMessage({ type: 'canvas-select', kind: 'image', tag: 'IMG', preview: el.src || '', sectionIndex: si }, '*');
              window.parent.postMessage({ type: 'image-click', src: el.src }, '*');
            });
          });

          // Global click handler for selection sync
          document.addEventListener('click', function(e) {
            var el = e.target;
            if (!el || el.tagName === 'HTML' || el.tagName === 'BODY') {
              clearAllHighlights();
              window.parent.postMessage({ type: 'canvas-select', kind: 'page', tag: 'BODY', preview: '', sectionIndex: -1 }, '*');
              return;
            }
            // Skip if img (handled above)
            if (el.tagName === 'IMG') return;

            var kind = classifyEl(el);
            var si = findSectionIndex(el);

            clearAllHighlights();

            // Apply highlight based on kind
            if (kind === 'section') {
              el.classList.add('section-selected');
            } else if (kind === 'button') {
              el.classList.add('yangu-btn-selected');
            } else if (kind === 'text') {
              el.classList.add('yangu-el-selected');
            } else if (kind === 'card') {
              el.classList.add('yangu-el-selected');
            }

            // Also select parent section
            if (kind !== 'section' && si >= 0) {
              var sections = document.querySelectorAll('section, footer, nav');
              if (sections[si]) sections[si].classList.add('section-selected');
            }

            window.parent.postMessage({
              type: 'canvas-select',
              kind: kind,
              tag: el.tagName,
              preview: getPreview(el, kind),
              sectionIndex: si,
              sectionId: si >= 0 ? (document.querySelectorAll('section, footer, nav')[si]?.id || '') : ''
            }, '*');

            // Legacy section-select for backward compat
            if (si >= 0) {
              window.parent.postMessage({ type: 'section-select', idx: si, tag: el.tagName }, '*');
            }
          }, true);
        });
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
        setPendingImageSrc(e.data.src);
        setImagePickerOpen(true);
      }
      if (e.data?.type === 'canvas-select' && onSelectionChange) {
        onSelectionChange({
          kind: e.data.kind,
          tag: e.data.tag,
          preview: e.data.preview,
          sectionIndex: e.data.sectionIndex >= 0 ? e.data.sectionIndex : undefined,
          sectionId: e.data.sectionId || undefined,
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHtmlChange, onSelectionChange]);

  // ─── Toolbar actions ──────────────────────────────────────────

  const getDoc = useCallback(() => iframeRef.current?.contentDocument, []);

  const pushHtmlUpdate = useCallback(() => {
    const doc = getDoc();
    if (doc) onHtmlChange(doc.documentElement.outerHTML);
  }, [getDoc, onHtmlChange]);

  const handleImageSelected = useCallback((url: string) => {
    const doc = getDoc();
    if (!doc) return;
    if (pendingImageSrc) {
      const img = doc.querySelector(`img[src="${CSS.escape(pendingImageSrc)}"]`) as HTMLImageElement | null;
      if (img) { img.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); return; }
    }
    const sel = doc.querySelector('.yangu-img-selected') as HTMLImageElement | null;
    if (sel) { sel.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); } else { toast.info("Click an image first, then replace."); }
  }, [getDoc, pushHtmlUpdate, pendingImageSrc]);

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

  const applyColorToPage = useCallback((color: string) => {
    const doc = getDoc();
    if (!doc) return;
    const allEls = doc.querySelectorAll("[style]");
    allEls.forEach(el => {
      const s = (el as HTMLElement).style;
      if (s.backgroundColor && (s.backgroundColor.includes("rgb") || s.backgroundColor.startsWith("#"))) {
        const tag = el.tagName;
        if (tag === "A" || tag === "BUTTON" || tag === "SPAN") {
          s.backgroundColor = color;
        }
      }
    });
    pushHtmlUpdate();
    toast.success("Style updated!");
  }, [getDoc, pushHtmlUpdate]);

  const handleMoveUp = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || !el.previousElementSibling || el.previousElementSibling.tagName === "NAV") { toast.info("Can't move further up."); return; }
    el.parentElement?.insertBefore(el, el.previousElementSibling);
    pushHtmlUpdate();
    toast.success("Section moved up!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

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

  const processedHtml = getEditableHtml(html);

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
          <ToolButton icon={Image} label="Replace Image" onClick={() => { setPendingImageSrc(undefined); setImagePickerOpen(true); }} />
          <ToolButton icon={Plus} label="Add Section" onClick={handleAddSection} />
          <ToolButton icon={Palette} label="Change Style" onClick={() => setColorPickerOpen(true)} />
          <ToolButton icon={ArrowUp} label="Move Up" onClick={handleMoveUp} />
          <ToolButton icon={ArrowDown} label="Move Down" onClick={handleMoveDown} />
          <ToolButton icon={Trash2} label="Remove" onClick={handleRemove} />
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 w-full flex items-start justify-center overflow-auto bg-muted/30">
        <iframe
          ref={iframeRef}
          srcDoc={processedHtml}
          className={`bg-white border-0 transition-all duration-300 ${
            viewportMode === "mobile"
              ? "w-[390px] h-full shadow-2xl rounded-xl border border-border mx-auto"
              : "w-full h-full"
          }`}
          title="Editable Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <EditorImagePickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={handleImageSelected}
      />
      <EditorColorPickerDialog
        open={colorPickerOpen}
        onOpenChange={setColorPickerOpen}
        onSelect={applyColorToPage}
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
