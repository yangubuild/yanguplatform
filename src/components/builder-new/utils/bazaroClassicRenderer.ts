// Source-faithful renderer for estore_bazaro_classic.
//
// The HTML is a cleaned mirror of
// https://html.aqlova.com/bazaro-prev/bazaro/index.html
// with <script> tags, preloader and inter-page navigation stripped.
// All static assets live at /templates/bazaro-classic/assets/ (served
// from /public/) so the same string renders identically in:
//   1. template picker thumbnail (separate jpg)
//   2. expanded preview iframe
//   3. variant carousel iframe
//   4. builder editor (metadata.builder_new_html)
//   5. published live page
//
// Reference: html.aqlova.com/bazaro-prev/bazaro/index.html

import bazaroHtml from "@/templates/bazaro-classic.html?raw";
import type { GeneratorConfig } from "./websiteGenerator";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function renderBazaroClassic(config: GeneratorConfig, _variantIndex: number): string {
  const name = (config.businessName || "Bazaro").trim();
  const safeName = escapeHtml(name);
  let html = bazaroHtml;

  // Replace the three visible "Bazaro" brand mentions (title, sign-in
  // heading, contact email) — leave URLs, classnames and asset paths alone.
  html = html.replace(
    /<title>Bazaro[^<]*<\/title>/i,
    `<title>${safeName} — Wholesale Store</title>`,
  );
  html = html.replace(/Sign in to bazaro\./gi, `Sign in to ${safeName}.`);
  html = html.replace(/Bazaro@gmail\.com/gi, `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`);

  // Optional logo override — if user uploaded a logo, swap the header logo.
  if (config.userLogoUrl) {
    html = html.replace(
      /src="\/templates\/bazaro-classic\/assets\/img\/logo\/logo\.png"/g,
      `src="${config.userLogoUrl}"`,
    );
  }

  return html;
}
