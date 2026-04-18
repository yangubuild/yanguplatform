

## Product Card System Modernization — Emenu & Eshop

I understand all 8 parts. Confirming scope: ONLY product cards + minimal commerce shell additions (wishlist, account dropdown, top-right icons). No editor navbar, sidebar, publish modal, or template layout changes. Emenu live behavior preserved.

### Part 1: Edit/Delete icons on ALL eshop cards
**Root cause**: `EditablePreview.tsx` requires both visual size threshold AND structural heuristics. Eshop renderers now emit `data-product-card="true"`, but the icon injector still falls through size/heuristic gates that fail on some templates.
**Fix**: In `EditablePreview.tsx`, short-circuit detection — if `el.matches('[data-product-card="true"]')`, inject icons immediately, bypassing `isLikelyProductCard` and size checks. Mirrors emenu where `.menu-item`/structural detection always wins.

### Part 2: Standardize card structure (Name → Desc → Price LEFT / Button RIGHT)
**Renderers**: `eshopFamilyRenderers.ts` — wrap price+button in `<div class="yangu-price-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">`. On mobile (`@media max-width:640px`), `.yangu-price-row` becomes `flex-direction:column;align-items:stretch` so button goes full-width below price.
**Cart bridge**: `emenuCartBridge.ts` already injects button into price row — confirm it appends inside `.yangu-price-row` not a sibling.

### Part 3: Wishlist system
- **Love icon**: Inject into every `[data-product-card="true"]` via `emenuCartBridge.ts` (top-right absolute over image). State stored in `localStorage` keyed by surface slug + product name (guest-safe, no auth required).
- **Wishlist drawer**: New component `PublicWishlistDrawer.tsx` opened by heart icon in top nav. Reads same localStorage. Shows image, name, price, "Move to Bag" (calls existing cart bridge add) and remove.
- **Count badge**: Heart icon in top nav shows count.

### Part 4: Top-nav icons + Account dropdown
- **Renderer additions** (`eshopFamilyRenderers.ts` header block only — keep template visual unchanged, only swap the existing icon row): `[Search] [Wishlist+badge] [Cart+badge] [Currency] [Account]` desktop; `[Search] [Wishlist]` mobile.
- **Account dropdown**: Static HTML structure (per spec sections) injected into header. Auth-aware: if logged in → show name/email + sections; if guest → show "Sign in / Create account". Items like Orders/Wishlist link to `/dashboard/...` or open the wishlist drawer. Empty sub-items (Wallet, Coupons, etc.) link to placeholder routes already in app or are hidden if route missing — no dead controls.

### Part 5: Default button text + 2-word limit
- **Defaults map**: New `src/lib/builder/productButtonDefaults.ts`:
  ```ts
  { emenu:"+ Add", eshop:"+ Add", estore:"+ Add", esite:"Book", influencer:"+ Add", community:"+ Add" }
  ```
- **Validation**: In `ProductCardEditorModal.tsx`, on button text save: `if (text.trim().split(/\s+/).length > 2) toast.error("Button text limited to 2 words"); return;`
- Cart bridge reads default from this map by `surfaceType`.

### Part 6: Product detail popup (visitor-side, not editor)
- **New**: `PublicProductDetailDialog.tsx` triggered by clicking any `[data-product-card="true"]` in published runtime (wired in `emenuCartBridge.ts`). Reuses existing dialog seen in screenshot 11.16.54.
- **Content**: image carousel (← →), name, brand, price, description, size chips (eshop), color swatches (eshop), qty −/+, "+ Add" / "Book", love icon. Reads `data-product-meta` JSON already persisted by editor.
- Editor click behavior unchanged (still opens `ProductCardEditorModal`).

### Part 7: Scope guardrails
Touch only: `eshopFamilyRenderers.ts`, `emenuCartBridge.ts`, `EditablePreview.tsx` (detection short-circuit only), `ProductCardEditorModal.tsx` (2-word validation only), new public components. Memory file `mem://commerce/product-card-layout-and-editor` updated with the full rule set so Estore/Esite/Influencer/Community inherit automatically when their renderers are built.

### Files to change
1. `src/components/builder-new/EditablePreview.tsx` — short-circuit detection on `[data-product-card]`
2. `src/components/builder-new/utils/eshopFamilyRenderers.ts` — `.yangu-price-row` wrapper, top-nav icon row, account dropdown HTML
3. `src/components/commerce/emenuCartBridge.ts` — inject love icon, image arrows, wire card click → detail dialog, mount wishlist drawer
4. `src/components/builder-new/ProductCardEditorModal.tsx` — 2-word button validation
5. **NEW** `src/lib/builder/productButtonDefaults.ts`
6. **NEW** `src/components/commerce/PublicWishlistDrawer.tsx`
7. **NEW** `src/components/commerce/PublicProductDetailDialog.tsx`
8. **NEW** `src/components/commerce/PublicAccountDropdown.tsx`
9. `mem://commerce/product-card-layout-and-editor` — append rules for future builders

### Verification (after build)
- Eshop editor: every product card shows edit/delete on hover ✅
- Emenu editor: unchanged ✅
- Live eshop: love icon every card, arrows on multi-image, price-LEFT/button-RIGHT desktop, stacked mobile, top-right icons full set, account dropdown opens, wishlist drawer functional, click card opens detail dialog ✅
- Editor: button text > 2 words rejected with toast ✅

