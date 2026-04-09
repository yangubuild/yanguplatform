import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeEditorHtml } from "@/lib/builder/editorHtml";

interface PublishedEmenuFrameProps {
  html: string;
  title: string;
}

export function PublishedEmenuFrame({ html, title }: PublishedEmenuFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(0);
  const sanitizedHtml = useMemo(() => sanitizeEditorHtml(html), [html]);

  const syncFrameHeight = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const nextHeight = Math.max(
      doc.documentElement.scrollHeight,
      doc.documentElement.offsetHeight,
      doc.body?.scrollHeight || 0,
      doc.body?.offsetHeight || 0,
      window.innerHeight,
    );

    setFrameHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !sanitizedHtml) return;

    let resizeObserver: ResizeObserver | null = null;
    let timeoutA: number | null = null;
    let timeoutB: number | null = null;

    const attachSizing = () => {
      syncFrameHeight();

      const doc = iframe.contentDocument;
      if (!doc) return;

      resizeObserver?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => syncFrameHeight());
        resizeObserver.observe(doc.documentElement);
        if (doc.body) resizeObserver.observe(doc.body);
      }

      timeoutA = window.setTimeout(syncFrameHeight, 120);
      timeoutB = window.setTimeout(syncFrameHeight, 600);
    };

    iframe.addEventListener("load", attachSizing);
    window.addEventListener("resize", syncFrameHeight);

    if (iframe.contentDocument?.readyState === "complete") {
      attachSizing();
    }

    return () => {
      iframe.removeEventListener("load", attachSizing);
      window.removeEventListener("resize", syncFrameHeight);
      resizeObserver?.disconnect();
      if (timeoutA) window.clearTimeout(timeoutA);
      if (timeoutB) window.clearTimeout(timeoutB);
    };
  }, [sanitizedHtml, syncFrameHeight]);

  return (
    <div className="min-h-screen bg-background">
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={sanitizedHtml}
        className="w-full border-0 bg-transparent"
        style={{ minHeight: "100vh", height: frameHeight ? `${frameHeight}px` : "100vh" }}
        sandbox="allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    </div>
  );
}