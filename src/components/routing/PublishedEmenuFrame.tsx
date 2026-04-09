import { useEffect, useRef } from "react";
import { YANGU_BADGE_HTML } from "@/components/routing/YanguBadge";

const PUBLISHED_EMENU_HEAD_INJECT = `<link href="https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap" rel="stylesheet">
<style>
:root{
  --yangu-published-header-width:1320px;
  --yangu-published-hero-width:1320px;
}
html,body{overflow-x:hidden;max-width:100vw;margin:0;padding:0;}
body{min-height:100vh;}
*,*::before,*::after{box-sizing:border-box;}
img,video,canvas,svg{max-width:100%;}
@media (min-width:1200px){
  body > nav:first-of-type,
  body > header:first-of-type{
    padding-left:max(28px, calc((100vw - var(--yangu-published-header-width)) / 2)) !important;
    padding-right:max(28px, calc((100vw - var(--yangu-published-header-width)) / 2)) !important;
  }
  body > nav:first-of-type + section,
  body > header:first-of-type + section,
  body > section:first-of-type{
    padding-left:max(40px, calc((100vw - var(--yangu-published-hero-width)) / 2)) !important;
    padding-right:max(40px, calc((100vw - var(--yangu-published-hero-width)) / 2)) !important;
  }
  body > nav:first-of-type + section[style*="grid-template-columns"],
  body > header:first-of-type + section[style*="grid-template-columns"],
  body > section:first-of-type[style*="grid-template-columns"]{
    column-gap:clamp(32px, 4vw, 56px) !important;
  }
}
</style>`;

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

    processedHtml = processedHtml.replace(/<a\b[^>]*href=["']https:\/\/yangu\.io["'][^>]*>[\s\S]*?<\/a>/gi, "");
    processedHtml = processedHtml.replace(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/gi, "");

    // Inject per-surface favicon into <head>
    if (faviconUrl && processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<link rel="icon" href="${faviconUrl}" type="image/png">\n<link rel="shortcut icon" href="${faviconUrl}" type="image/png">\n</head>`
      );
    }

    // Inject desktop layout guards + Lufga font for badge + contained public hero/header frame
    if (processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `${PUBLISHED_EMENU_HEAD_INJECT}\n</head>`
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
