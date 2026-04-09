import { useEffect } from "react";

interface PublishedEmenuFrameProps {
  html: string;
  title: string;
  faviconUrl?: string | null;
  showBadge?: boolean;
}

/** Inline SVG badge icon (YANGU logo, orange rounded square with Y) */
const BADGE_SVG = `<svg width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#E8612D"/><path d="M50 30L35 50h10v20h10V50h10L50 30z" fill="white"/></svg>`;

const BADGE_HTML = `<a href="https://yangu.io" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:6px 12px 6px 8px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#333;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-decoration:none;cursor:pointer;line-height:1;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'">${BADGE_SVG} Made in YANGU</a>`;

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

    // Inject overflow-prevention CSS
    if (processedHtml.includes("</head>")) {
      processedHtml = processedHtml.replace(
        "</head>",
        `<style>html,body{overflow-x:hidden;max-width:100vw;margin:0;}*{box-sizing:border-box;}</style>\n</head>`
      );
    }

    // Inject "Made in YANGU" badge for free-plan surfaces
    if (showBadge && processedHtml.includes("</body>")) {
      processedHtml = processedHtml.replace("</body>", `${BADGE_HTML}\n</body>`);
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
