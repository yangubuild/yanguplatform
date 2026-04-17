

## What I found (verified by reading both files)

**Eshop has 6 renderers. Two of them are broken:**

### Card #1 (missing edit/delete icons) — `renderMockhub`, line 1727
```html
<a href="#" class="aema-card" style="...">
  <p>${it.title}</p>            ← no data-product-role="title"
  <span>${it.tag}</span>         ← chip on LEFT
  <span>${it.price}</span>       ← price on RIGHT
</a>
```
- No `data-product-card="true"`
- No role markers
- Layout violates the rule: it's `[tag-chip LEFT | price RIGHT]` with no button — and price is on the wrong side
- The heuristic `getProductPriceEl` sometimes picks the tag chip (e.g. "New") instead of the price, so detection fails on at least one card → **no icons**

### Card #2 (duplicated name + price) — `renderLumel`, line 1997
```html
<article class="yangu-product-card" data-yangu-product="true"
         data-yangu-product-name="${p.title}" data-yangu-product-price="${p.price}">
  <h3 class="yangu-product-name">${p.title}</h3>     ← already has title
  <span class="yangu-product-price">${p.price}</span> ← already has price
</article>
```
- Uses **legacy** `data-yangu-product-*` attributes that the cart bridge / normalizer reads
- Has NO `data-product-role` attributes
- So `markProductRoles` runs `cleanupStructuredProductCard` AND `normalizeLegacyProductCard` on it, which inject title/price text again from the legacy attrs → **visible duplicate name + price below the originals**

## How emenu solved this (the working reference)

I read `emenuFamilyRenderers.ts` lines 200–220. **Emenu cards have ZERO marker attributes** — no `data-product-card`, no `data-product-role`, no `data-yangu-product`. Every emenu card uses the SAME structure:
```html
<div class="yangu-product-grid">
  <div>                                          ← plain div
    <img />
    <div>
      <span>title</span> <span>price</span>      ← title LEFT, price RIGHT, flex justify-between
    </div>
  </div>
</div>
```
The heuristic `isLikelyProductCard` succeeds 100% because every card has identical clean structure: img + name + price, no legacy attrs, no half-marked roles, no chips that look like prices.

**The fix is not to add more attributes — it's to make Mockhub and Lumel match emenu's clean structure.**

## The fix (mirror emenu exactly)

### Edit `src/components/builder-new/utils/eshopFamilyRenderers.ts` only

**Mockhub card (line 1727–1738):** replace with emenu-style clean structure
```html
<a href="#" class="aema-card" style="display:block;...">
  <div><img .../></div>
  <div style="padding:16px 18px;">
    <p style="font-size:14px;font-weight:600;">${it.title}</p>    ← name on top
    ${it.tag ? `<p style="font-size:11px;color:${t.mutedText};">${it.tag}</p>` : ""}  ← optional tag as sub-line
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:700;">${it.price}</span>   ← price LEFT
    </div>
  </div>
</a>
```
No marker attributes. Heuristic will detect it.

**Lumel card (line 1997–2010):** strip ALL legacy markers, match emenu structure
```html
<article style="background:${t.panelBg};...;display:flex;flex-direction:column;">
  <div><img .../></div>
  <div style="padding:24px;">
    ${p.volume ? `<p style="font-size:11px;...">${p.volume}</p>` : ""}
    <h3 style="font-size:22px;">${p.title}</h3>           ← name
    ${p.note ? `<p style="font-size:13px;...">${p.note}</p>` : ""}  ← description (kept in order: name → desc)
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
      <span style="font-size:20px;">${p.price}</span>     ← price LEFT
    </div>
  </div>
</article>
```
Remove: `class="yangu-product-card"`, `data-yangu-product`, `data-yangu-product-id`, `data-yangu-product-name`, `data-yangu-product-price`, `class="yangu-product-name"`, `class="yangu-product-price"`, `class="yangu-product-add"`, the inline `+ Add` button.

The live `+ Add` button is injected at runtime by `emenuCartBridge.ts` (already working on emenu and other eshop templates).

### No changes to `EditablePreview.tsx`

The detection logic already works — that's proven by emenu. The bug is template-level pollution, not detection-level. Adding more flags would just paper over the real cause.

## Verification protocol (before reporting fixed)

1. Read the canvas via `browser--extract` and count product cards vs edit/delete icons across all 6 eshop templates (Aema, Uncover, Kanva, Minna, Mockhub, Lumel) — must match 1:1.
2. For each card extract title text and price text — no card may show title or price twice.
3. Refresh once, re-verify (catches any non-idempotent damage).
4. Switch templates and re-verify on each.

Only report success if all four checks pass on all six renderers.

## Files to edit
- `src/components/builder-new/utils/eshopFamilyRenderers.ts` — Mockhub renderer (~line 1727), Lumel renderer (~line 1997)

No other files. No new attributes. No detection changes. Mirror what already works in emenu.

