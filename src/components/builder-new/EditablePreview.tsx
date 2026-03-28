import { useRef, useEffect, useState } from "react";
import { Pencil, Image, Trash2, Plus, Palette } from "lucide-react";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
}

export function EditablePreview({ html, onHtmlChange }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Your Website Draft</span>
        </div>
        <div className="flex items-center gap-1">
          <ToolButton icon={Pencil} label="Edit Text" active={editMode} onClick={() => setEditMode(!editMode)} />
          <ToolButton icon={Image} label="Replace Image" onClick={() => {}} />
          <ToolButton icon={Plus} label="Add Section" onClick={() => {}} />
          <ToolButton icon={Palette} label="Change Style" onClick={() => {}} />
          <ToolButton icon={Trash2} label="Remove Section" onClick={() => {}} />
        </div>
      </div>

      {editMode && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 text-xs text-primary">
          Click on any text in the preview to edit it. Use the chat to describe style changes.
        </div>
      )}

      {/* Preview iframe */}
      <iframe
        ref={iframeRef}
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
