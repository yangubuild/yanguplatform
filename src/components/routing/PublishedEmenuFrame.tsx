import { useEffect } from "react";
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
 */
export function PublishedEmenuFrame({ html, title, faviconUrl, showBadge }: PublishedEmenuFrameProps) {
  useEffect(() => {
    if (!html) return;

    document.title = title;

    let processedHtml = html;

    // Inject per-surface favicon into <head>
    if (faviconUrl && processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<link rel="icon" href="${faviconUrl}" type="image/png">\n</head>`
      );
    }

    // Inject desktop layout guards (consistent container + overflow prevention)
    if (processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<style>html,body{overflow-x:hidden;max-width:100vw;margin:0;padding:0;}body{min-height:100vh;}*,*::before,*::after{box-sizing:border-box;}img,video,canvas,svg{max-width:100%;}</style>\n</head>`
      );
    }

    // Inject "Made in YANGU" badge for free-plan surfaces
    if (showBadge && processedHtml.includes("</body>")) {
      processedHtml = processedHtml.replace("</body>", `${YANGU_BADGE_HTML}\n</body>`);
    }

    try {
      document.open();
      document.write(processedHtml);
      document.close();
    } catch {
      document.documentElement.innerHTML = processedHtml;
    }
  }, [html, title, faviconUrl, showBadge]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
