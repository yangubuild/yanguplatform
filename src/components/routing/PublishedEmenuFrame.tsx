import { useEffect, useMemo, useRef } from "react";
import { YANGU_BADGE_HTML } from "@/components/routing/YanguBadge";
import { buildCartBridgeCode, buildCartBridgeScript } from "@/components/commerce/emenuCartBridge";

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

body > *:not([data-yangu-badge]):not(#yangu-cart-btn){
  width:100% !important;
  max-width:1100px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  padding-left:20px !important;
  padding-right:20px !important;
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
  max-width:1100px !important;
  margin-left:auto !important;
  margin-right:auto !important;
  padding-left:20px !important;
  padding-right:20px !important;
  box-sizing:border-box !important;
}

/* Product/menu grid density */
.yangu-product-grid,
[style*="grid-template-columns:repeat("][style*="gap"]{
  grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)) !important;
  gap:16px !important;
}
.yangu-product-grid > *,
[style*="grid-template-columns"] > div[style*="border-radius"]{
  max-width:320px !important;
  justify-self:center !important;
  width:100% !important;
}

nav,.navbar,[class*="nav"]{
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  width:100% !important;
}

nav a,.nav-link,[class*="nav-item"]{
  font-size:0.9rem !important;
  font-weight:500 !important;
}
button:not(.yangu-live-cta):not(#yangu-cart-btn),.btn:not(#yangu-cart-btn),[class*="button"]:not(.yangu-live-cta):not(#yangu-cart-btn){
  font-size:0.9rem !important;
  padding:10px 20px !important;
}
.yangu-live-cta {
  padding:8px 0 !important;
  font-size:14px !important;
}
h1,.hero-title{
  font-size:3rem !important;
  line-height:1.2 !important;
}
h2,.section-title{
  font-size:1.75rem !important;
}

/* ── Mobile-first responsive (web-app behavior) ── */
@media (max-width: 768px) {
  /* Web-app flow: stack everything, no desktop absolute leakage */
  body { display:block !important; }
  body > *:not([data-yangu-badge]):not(#yangu-cart-btn) {
    position:relative !important;
    float:none !important;
    width:100% !important;
    max-width:100% !important;
    padding-left:16px !important;
    padding-right:16px !important;
  }
  /* Constrain hero/nav logo images that explode on mobile */
  nav img, header img, [class*="hero"] img, [class*="logo"] img {
    max-width:140px !important;
    max-height:64px !important;
    width:auto !important;
    height:auto !important;
    object-fit:contain !important;
  }
  /* Hero sections: cap height so they don't dominate viewport */
  section:first-of-type, [class*="hero"], [class*="Hero"] {
    min-height:auto !important;
    max-height:none !important;
  }
  section:first-of-type img:not([class*="logo"]),
  [class*="hero"] img:not([class*="logo"]),
  [class*="Hero"] img:not([class*="logo"]) {
    max-height:280px !important;
    width:100% !important;
    object-fit:cover !important;
  }
  /* Nav must wrap below hero, never overlap content */
  nav {
    position:relative !important;
    flex-wrap:wrap !important;
    gap:8px !important;
    padding:12px 16px !important;
  }
  body > section:not([data-yangu-badge]) > *,
  body > header:not([data-yangu-badge]) > *,
  body > footer:not([data-yangu-badge]) > *,
  body > nav:not([data-yangu-badge]) > * {
    padding-left:16px !important;
    padding-right:16px !important;
  }
  .yangu-product-grid,
  [style*="grid-template-columns:repeat("]{
    grid-template-columns:1fr !important;
  }
  .yangu-product-grid > *,
  [style*="grid-template-columns"] > div[style*="border-radius"]{
    max-width:100% !important;
  }
  h1,.hero-title {
    font-size:2rem !important;
    line-height:1.25 !important;
  }
  h2,.section-title {
    font-size:1.5rem !important;
  }
  h3 { font-size:1.15rem !important; }
  nav { flex-wrap:wrap !important; gap:8px !important; }
  nav a,.nav-link,[class*="nav-item"] {
    font-size:0.875rem !important;
  }
  button:not(.yangu-live-cta):not(#yangu-cart-btn),.btn:not(#yangu-cart-btn),[class*="button"]:not(.yangu-live-cta):not(#yangu-cart-btn) {
    font-size:0.875rem !important;
    padding:8px 16px !important;
  }
  [style*="display: flex"][style*="gap"] {
    flex-wrap: wrap !important;
  }
  img { height: auto !important; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .yangu-product-grid,
  [style*="grid-template-columns:repeat("]{
    grid-template-columns:repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  h1,.hero-title {
    font-size:1.75rem !important;
  }
  h2,.section-title {
    font-size:1.25rem !important;
  }
}

/* Smooth scroll */
html { scroll-behavior: smooth; }

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
  currency?: string;
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
  currency = "USD",
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

    // Add viewport meta for mobile
    if (!h.includes('name="viewport"') && h.includes("</head>")) {
      h = h.replace("</head>", `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>`);
    }

    if (h.includes("</head>")) {
      h = h.replace("</head>", `${PUBLISHED_EMENU_HEAD_INJECT}\n</head>`);
    }

    if (showBadge && h.includes("</body>")) {
      h = h.replace("</body>", `${YANGU_BADGE_HTML}\n</body>`);
    }

    // Inject cart bridge script with configured currency
    if (orderingEnabled && h.includes("</body>")) {
      h = h.replace("</body>", `${buildCartBridgeScript(currency)}\n</body>`);
    }

    if (h.includes("<title>")) {
      h = h.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    }

    return h;
  }, [html, title, faviconUrl, showBadge, orderingEnabled, currency]);

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

  // Inject cart bridge script into iframe contentDocument after load
  // (srcdoc inline <script> tags may not execute reliably in all browsers)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !orderingEnabled) return;

    const injectBridge = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        // Skip if already injected
        if (doc.getElementById("yangu-cart-btn")) return;
        const script = doc.createElement("script");
        script.textContent = buildCartBridgeCode(currency);
        doc.body.appendChild(script);
      } catch (e) {
        console.warn("[PublishedEmenuFrame] bridge inject error:", e);
      }
    };

    iframe.addEventListener("load", injectBridge);
    // Also try after a delay in case load already fired
    const timer = setTimeout(injectBridge, 1500);
    return () => {
      iframe.removeEventListener("load", injectBridge);
      clearTimeout(timer);
    };
  }, [orderingEnabled, currency]);

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
