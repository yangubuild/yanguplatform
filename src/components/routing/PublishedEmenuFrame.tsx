import { useEffect, useMemo, useRef } from "react";
import { YANGU_BADGE_HTML } from "@/components/routing/YanguBadge";
import { EMENU_CART_BRIDGE_SCRIPT } from "@/components/commerce/emenuCartBridge";

const PUBLISHED_EMENU_HEAD_INJECT = `<link href="https://api.fontshare.com/v2/css?f[]=lufga@700&display=swap" rel="stylesheet">
<style>
html,body{
  overflow-x:hidden;max-width:100vw;margin:0;padding:0;
  font-size:16px !important;
}
body{
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;
}
*,*::before,*::after{box-sizing:border-box;}
img,video,canvas,svg{max-width:100%;}

body > *:not([data-yangu-badge]){
  width:100% !important;
  max-width:1320px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  padding-left:24px !important;
  padding-right:24px !important;
  box-sizing:border-box !important;
}

body > section:not([data-yangu-badge]),
body > header:not([data-yangu-badge]),
body > footer:not([data-yangu-badge]),
body > nav:not([data-yangu-badge]){
  max-width:100% !important;
  padding-left:0 !important;
  padding-right:0 !important;
}
body > section:not([data-yangu-badge]) > *,
body > header:not([data-yangu-badge]) > *,
body > footer:not([data-yangu-badge]) > *,
body > nav:not([data-yangu-badge]) > *{
  max-width:1320px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  padding-left:24px !important;
  padding-right:24px !important;
  box-sizing:border-box !important;
}

nav,.navbar,[class*="nav"]{
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  width:100% !important;
}

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
  orderingEnabled?: boolean;
  onPostMessage?: (data: any) => void;
}

/**
 * Renders published Emenu HTML in an iframe (via srcdoc) so the parent React
 * shell stays alive for commerce overlays (cart, checkout, WhatsApp).
 */
export function PublishedEmenuFrame({
  html,
  title,
  faviconUrl,
  showBadge,
  orderingEnabled,
  onPostMessage,
}: PublishedEmenuFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Process HTML once
  const processedHtml = useMemo(() => {
    let h = html;

    h = h.replace(/<a\b[^>]*href=["']https:\/\/yangu\.io["'][^>]*>[\s\S]*?<\/a>/gi, "");
    h = h.replace(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/gi, "");

    if (faviconUrl && h.includes("</head>")) {
      h = h.replace(
        "</head>",
        `<link rel="icon" href="${faviconUrl}" type="image/png">\n<link rel="shortcut icon" href="${faviconUrl}" type="image/png">\n</head>`
      );
    }

    if (h.includes("</head>")) {
      h = h.replace("</head>", `${PUBLISHED_EMENU_HEAD_INJECT}\n</head>`);
    }

    if (showBadge && h.includes("</body>")) {
      h = h.replace("</body>", `${YANGU_BADGE_HTML}\n</body>`);
    }

    // Inject cart bridge script if ordering enabled
    if (orderingEnabled && h.includes("</body>")) {
      h = h.replace("</body>", `${EMENU_CART_BRIDGE_SCRIPT}\n</body>`);
    }

    if (h.includes("<title>")) {
      h = h.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    }

    return h;
  }, [html, title, faviconUrl, showBadge, orderingEnabled]);

  // Listen for postMessage from iframe
  useEffect(() => {
    if (!onPostMessage) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type?.startsWith("yangu_")) {
        onPostMessage(e.data);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onPostMessage]);

  // Set document title/favicon in parent
  useEffect(() => {
    document.title = title;
    if (faviconUrl) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
    return () => { document.title = "YANGU"; };
  }, [title, faviconUrl]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={processedHtml}
      title={title}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
      }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  );
}
