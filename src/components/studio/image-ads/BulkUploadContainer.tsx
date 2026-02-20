import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, ImagePlus, X } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/zip"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.zip";

interface Props {
  onBack: () => void;
  onUploadComplete: (files: File[]) => void;
}

export function BulkUploadContainer({ onBack, onUploadComplete }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) =>
      ACCEPTED_TYPES.includes(f.type) || f.name.endsWith(".zip")
    );
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="absolute inset-0 z-30 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 pt-8 pb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-foreground">Bulk Upload</h2>
      </div>

      {/* Upload Zone */}
      <div className="flex-1 overflow-y-auto px-8 pb-24">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-colors min-h-[280px] ${
            dragging
              ? "border-accent/60 bg-accent/5"
              : "border-border/40 hover:border-border bg-card/30"
          }`}
        >
          <div className="h-14 w-14 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
            <ImagePlus className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Drag & drop files here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          <p className="text-xs text-muted-foreground mt-3">Supports JPG, PNG, WEBP, ZIP</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File preview list */}
        {files.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/60 px-4 py-2.5">
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-border/40 bg-background">
        <Button variant="outline" onClick={onBack} className="rounded-lg">
          Cancel
        </Button>
        <Button
          variant="accent"
          disabled={files.length === 0}
          onClick={() => onUploadComplete(files)}
          className="rounded-lg"
        >
          Upload files
        </Button>
      </div>
    </div>
  );
}
