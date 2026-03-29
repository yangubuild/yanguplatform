import { useRef, useEffect, useState, useCallback } from "react";
import { Pencil, Image, Trash2, Plus, Palette, ArrowUp, ArrowDown, Type } from "lucide-react";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
}

export function EditablePreview({ html, onHtmlChange }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editMode, setEditMode] = useState(false);

  // Inject editable script into iframe
  const getEditableHtml = useCallback((baseHtml: string, editable: boolean) => {
    if (!editable) return baseHtml;
    
    // Inject contenteditable + click handlers
    const editScript = `
      <style>
        [contenteditable]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; cursor: text; }
        [contenteditable]:focus { outline: 2px solid #22c55e; outline-offset: 2px; }
        .section-hover { position: relative; }
        .section-hover:hover::after {
          content: ''; position: absolute; inset: 0;
          border: 2px dashed #22c55e44; pointer-events: none; border-radius: 8px;
        }
        img:hover { outline: 2px solid #3b82f644; cursor: pointer; }
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
          // Add hover class to sections
          document.querySelectorAll('section').forEach(function(el) {
            el.classList.add('section-hover');
          });
          // Image click
          document.querySelectorAll('img').forEach(function(el) {
            el.addEventListener('click', function(e) {
              e.preventDefault();
              window.parent.postMessage({ type: 'image-click', src: el.src }, '*');
            });
          });
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
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHtmlChange]);

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
          <ToolButton icon={Image} label="Replace Image" onClick={() => {}} />
          <ToolButton icon={Plus} label="Add Section" onClick={() => {}} />
          <ToolButton icon={Palette} label="Change Style" onClick={() => {}} />
          <ToolButton icon={ArrowUp} label="Move Up" onClick={() => {}} />
          <ToolButton icon={ArrowDown} label="Move Down" onClick={() => {}} />
          <ToolButton icon={Trash2} label="Remove" onClick={() => {}} />
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

function ToolButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
