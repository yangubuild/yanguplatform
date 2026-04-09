import { useEffect, useRef } from "react";
import { YANGU_BADGE_HTML } from "@/components/routing/YanguBadge";

const PUBLISHED_EMENU_HEAD_INJECT = `<link href="https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap" rel="stylesheet">
<style>
html,body{
  overflow-x:hidden;max-width:100vw;margin:0;padding:0;
  font-size:16px !important;
}
body{
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;
  background-color:#ffffff;
}
*,*::before,*::after{box-sizing:border-box;}
img,video,canvas,svg{max-width:100%;}

/* Unified 1320px centered container for ALL sections */
header,nav,.hero,section,
[class*="hero"],[class*="header"],[class*="nav"],[class*="section"],[class*="container"],
footer{
  width:100% !important;
  max-width:1320px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  padding-left:24px !important;
  padding-right:24px !important;
  box-sizing:border-box !important;
}

/* Navigation — space-between distribution */
nav,.navbar,[class*="nav"]{
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  width:100% !important;
}

/* Restore proper font sizes */
nav a,.nav-link,[class*="nav-item"]{
  font-size:1rem !important;
  font-weight:500 !important;
}
button,.btn,[class*="button"]{
  font-size:1rem !important;
  padding:10px 20px !important;
}
h1,.hero-title{
  font-size:3.5rem !important;
  line-height:1.2 !important;
}
h2,.section-title{
  font-size:2rem !important;
}

/* Exclude the yangu badge from container rules */
[data-yangu-badge]{
  max-width:none !important;
  margin-left:unset !important;
  margin-right:unset !important;
  padding-left:10px !important;
  padding-right:14px !important;
  width:auto !important;
  justify-content:flex-start !important;
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
