/**
 * Neutralize placeholder/internal anchors in a sanitized HTML document before
 * it is injected into an <iframe srcDoc>. A bare `href="#"` or empty `href`
 * inside a srcdoc iframe triggers a real navigation that DISCARDS the
 * injected content (the iframe boots a fresh app at about:srcdoc and falls
 * back to the generic SPA shell). Real destinations (http, mailto, tel, etc.)
 * are left untouched.
 *
 * Used only for the extracted-template iframe branch (Bazaro Classic). Do
 * NOT use on non-iframe rendering paths; those use React event delegation.
 */
export function neutralizePlaceholderLinks(html: string): string {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const anchors = doc.querySelectorAll("a");
    anchors.forEach((a) => {
      const raw = (a.getAttribute("href") || "").trim();
      const isPlaceholder =
        raw === "" ||
        raw === "#" ||
        /^javascript:/i.test(raw);
      if (isPlaceholder) {
        a.setAttribute("href", "#");
        a.setAttribute("onclick", "return false;");
        a.setAttribute("data-yangu-placeholder-link", "1");
      }
    });
    // Ensure <a target="_blank"> for any link that does navigate elsewhere
    // would open in a new tab — but only if author didn't set a target.
    // (Keeps the iframe content alive on real external links too.)
    anchors.forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href || href === "#") return;
      if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) {
        if (!a.getAttribute("target")) {
          a.setAttribute("target", "_blank");
          const rel = a.getAttribute("rel") || "";
          if (!/noopener/.test(rel)) {
            a.setAttribute("rel", (rel + " noopener noreferrer").trim());
          }
        }
      }
    });
    // Serialize back as a full document so <html>/<head>/<link> survive.
    return "<!doctype html>" + doc.documentElement.outerHTML;
  } catch {
    return html;
  }
}
