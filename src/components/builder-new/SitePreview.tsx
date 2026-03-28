import { useRef, useEffect } from "react";

interface SitePreviewProps {
  html: string;
}

export function SitePreview({ html }: SitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
        </div>
        <div className="flex-1 bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground text-center truncate">
          Preview
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="flex-1 w-full bg-white"
        title="Website Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
}
