import { useEffect, useRef } from "react";
import { YANGU_BADGE_HTML } from "@/components/routing/YanguBadge";

interface PublishedEmenuFrameProps {
  html: string;
  title: string;
  faviconUrl?: string | null;
  showBadge?: boolean;
}

/**
 * Renders a published Emenu page by writing the full HTML document directly
 * into the current page. No iframe — the published HTML IS the page.
 *
 * Once document.write() fires, React is gone — this is a one-way exit.
 */
export function PublishedEmenuFrame({ html, title, faviconUrl, showBadge }: PublishedEmenuFrameProps) {
  const writtenRef = useRef(false);

  useEffect(() => {
    if (!html || writtenRef.current) return;
    writtenRef.current = true;

    let processedHtml = html;

    // Inject per-surface favicon into <head>
    if (faviconUrl && processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<link rel="icon" href="${faviconUrl}" type="image/png">\n</head>`
      );
    }

    // Inject desktop layout guards + Lufga font for badge
    if (processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<link href="https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap" rel="stylesheet">
<style>
html,body{overflow-x:hidden;max-width:100vw;margin:0;padding:0;}
body{min-height:100vh;}
*,*::before,*::after{box-sizing:border-box;}
img,video,canvas,svg{max-width:100%;}
</style>
</head>`
      );
    }

    // Inject "Made in yangu" badge for free-plan surfaces
    if (showBadge && processedHtml.includes("</body>")) {
      processedHtml = processedHtml.replace("</body>", `${YANGU_BADGE_HTML}\n</body>`);
    }

    // Set title
    if (processedHtml.includes("<title>")) {
      processedHtml = processedHtml.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    }

    try {
      document.open();
      document.write(processedHtml);
      document.close();
    } catch {
      // Fallback: inject into existing document
      document.documentElement.innerHTML = processedHtml;
    }
  }, [html, title, faviconUrl, showBadge]);

  // Shown momentarily while useEffect fires — then replaced by document.write
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
