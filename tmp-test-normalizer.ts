import { Window } from "happy-dom";
import { readFileSync } from "fs";

const html = readFileSync("/tmp/doood.html", "utf8");
const win = new Window();
const doc = win.document;
doc.body.innerHTML = html;

function normalizeText(v: any) { return (v || "").replace(/\s+/g, " ").trim(); }
function isPriceText(text: string) {
  const compact = normalizeText(text);
  if (!compact || compact.length > 40) return false;
  return /(?:[$€£₦]\s*\d|\b(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|KSh)\s*\d|R\s*\d|\d[\d.,]*\s*(?:[$€£₦]|UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|KSh))/i.test(compact);
}
function looksLikeProductCard(el: any) {
  if (el.getAttribute("data-product-card") === "true") return true;
  const hasTitle = !!el.querySelector('[data-product-role="title"], h1, h2, h3, h4, h5, h6, p.truncate, strong');
  const hasPrice = isPriceText(el.textContent || "");
  return hasTitle && hasPrice;
}
const cards = new Set<any>();
const candidates = doc.querySelectorAll("span, p, div, strong, b, em, h2, h3, h4, h5, h6");
candidates.forEach((el: any) => {
  const text = normalizeText(el.textContent);
  if (!text || text.length > 40 || !isPriceText(text)) return;
  if (Array.from(el.children).some((c: any) => isPriceText(normalizeText(c.textContent)))) return;
  let node = el.parentElement, best = null, depth = 0;
  while (node && depth < 7 && node !== doc.body) {
    const t = normalizeText(node.textContent);
    if (t.length > 600) break;
    if (looksLikeProductCard(node)) best = node;
    node = node.parentElement; depth++;
  }
  if (best) cards.add(best);
});
const final = Array.from(cards).filter((c: any) => !Array.from(cards).some((o: any) => o !== c && c.contains(o)));
console.log("cards detected:", final.length);
final.forEach((c: any) => {
  const title = c.querySelector("h1,h2,h3,h4,h5,h6,strong,p.truncate")?.textContent?.trim().slice(0, 40);
  const price = normalizeText(c.textContent).match(/\d[\d.,]*\s*€|\€\s*\d[\d.,]*|\d[\d.,]*\s*EUR/i)?.[0];
  const hasBtn = !!c.querySelector("button, .yangu-live-cta, .yangu-cta");
  console.log("-", JSON.stringify(title), "| price:", price, "| existing button:", hasBtn);
});
