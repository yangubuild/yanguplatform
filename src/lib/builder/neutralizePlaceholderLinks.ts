/**
 * Neutralize placeholder/internal anchors in a sanitized HTML document before
 * it is injected into an <iframe srcDoc>. A bare `href="#"` or empty `href`
 * inside a srcdoc iframe triggers a real navigation that DISCARDS the
 * injected content (the iframe boots a fresh app at about:srcdoc and falls
 * back to the generic SPA shell). Real destinations (http, mailto, tel, etc.)
 * are left untouched.
 *
 * Used for public HTML snapshots before iframe srcDoc or inline HTML injection.
 * Real destinations (http, mailto, tel, etc.) are left untouched.
 */
export function neutralizePlaceholderLinks(html: string): string {
  if (!html) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    neutralizeDocument(doc, 0);
    // Serialize back as a full document so <html>/<head>/<link> survive.
    return "<!doctype html>" + doc.documentElement.outerHTML;
  } catch {
    return html;
  }
}

function neutralizeDocument(doc: Document, depth: number): void {
  const anchors = doc.querySelectorAll("a");
  anchors.forEach((a) => {
    const raw = (a.getAttribute("href") || "").trim();
    const isPlaceholder =
      raw === "" ||
      raw === "#" ||
      /^javascript:/i.test(raw);
    if (isPlaceholder) {
      // Remove href entirely — without href the anchor will not navigate,
      // and onclick="return false" alone is unreliable inside srcdoc iframes
      // in some browsers because the click still races into navigation of
      // the about:srcdoc document (which discards srcDoc content).
      a.removeAttribute("href");
      a.setAttribute("role", "button");
      a.setAttribute("tabindex", "0");
      a.setAttribute("onclick", "event.preventDefault();event.stopPropagation();return false;");
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
  // Neutralize <form> with placeholder action — same srcdoc-navigation risk.
  doc.querySelectorAll("form").forEach((f) => {
    const action = (f.getAttribute("action") || "").trim();
    if (action === "" || action === "#") {
      f.setAttribute("onsubmit", "event.preventDefault();event.stopPropagation();return false;");
      f.setAttribute("data-yangu-placeholder-form", "1");
    }
  });

  // Stored snapshots can themselves contain iframe-wrapped HTML. Rewrite the
  // nested srcdoc too; otherwise the outer HTML is neutralized but the actual
  // rendered iframe document still contains live href="#" anchors.
  if (depth < 3) {
    doc.querySelectorAll("iframe").forEach((iframe) => {
      const srcdoc = iframe.getAttribute("srcdoc");
      if (srcdoc) {
        try {
          const nestedDoc = new DOMParser().parseFromString(srcdoc, "text/html");
          neutralizeDocument(nestedDoc, depth + 1);
          iframe.setAttribute("srcdoc", "<!doctype html>" + nestedDoc.documentElement.outerHTML);
        } catch {
          // Leave malformed nested srcdoc untouched.
        }
      }

      const src = (iframe.getAttribute("src") || "").trim();
      if (src === "" || src === "#") {
        iframe.setAttribute("src", "about:blank");
      }
    });
  }
}
