

# Fix Plan: Editor Stability, Currency, Product Controls, Live CTAs

## Root Causes Identified

### 1. Infinite Repair Loop (Page Unresponsive)
**File**: `EditablePreview.tsx`, lines 789-793 and 873-876
**Cause**: `injectProductControls()` repairs DOM → calls `notifyHtmlUpdate()` → parent receives `html-update` → sets new `liveHtml` → iframe reloads → `injectProductControls()` runs again. Additionally, a `MutationObserver` on `document.body` re-triggers `injectProductControls()` on every DOM change, including the repairs themselves.

### 2. Product Editor Popup Not Opening
**File**: `EditablePreview.tsx`, lines 920-928
**Cause**: Clicking a product card sends `canvas-select` with `kind: 'page'` — a generic deselect-level message. The parent never receives `product-edit-request`, so the modal never opens. Only the small pencil icon button triggers the edit flow.

### 3. First Card Currency Corruption
**File**: `EmenuNewEditor.tsx`, lines 123-133
**Cause**: `formatProductPrice` calls `getRecognizedCurrencyAffix(existingPrice)` which only looks at the current card's price text. If the existing price is corrupted (e.g., "ick,20"), no valid affix is found, and the price saves as bare digits with no currency. No fallback to sibling cards or surface-configured currency.

### 4. Live CTA Buttons Missing
**File**: `emenuCartBridge.ts`, lines ~65-75
**Cause**: `isProductCard()` marks `data-cart-processed` on the card BEFORE confirming price parsing succeeds. If `parseFloat(numStr)` returns `NaN`, the function returns early but the card is already marked processed, so the retry timeouts skip it. Also, `findNameEl`/`findPriceEl` don't check `data-product-role` attributes that the editor now sets on all cards.

### 5. Duplicate Text Corruption
**File**: `EditablePreview.tsx`, lines 488-620
**Cause**: `cleanupStructuredProductCard` removes "extra" nodes, but `normalizeLegacyProductCard` creates new title/price/description elements without fully clearing the old flattened content node first. On subsequent loads, both the old text and new structured elements coexist.

---

## Exact Changes Per File

### `src/components/builder-new/EditablePreview.tsx`

**Fix 1 — Break the repair loop:**
- In `injectProductControls()` (line 789-793): Remove the `notifyHtmlUpdate()` call after repairs. Repairs are cosmetic normalization for the editor canvas — they should NOT push HTML back to the parent and trigger a reload.
- In the MutationObserver (line 873-876): Add a guard flag (`_yanguInjecting`) so mutations caused by `injectProductControls` itself don't re-trigger it.

**Fix 2 — Product card click opens editor:**
- In the click handler (lines 920-928): Change the product card click to send `product-edit-request` with `getProductPayload(card)` instead of sending `canvas-select` with `kind: 'page'`. This makes clicking anywhere on the card open the editor popup, matching user expectation.

**Fix 3 — Prevent duplicate text from normalization:**
- In `normalizeLegacyProductCard()` (line 549-620): Before creating new structured elements, fully clear the content container's innerHTML. Already done on line 566 (`contentContainer.innerHTML = ''`), but when `contentContainer` is a newly created div that's appended, the OLD `legacy.contentEl` still exists with its text. Add explicit removal of `legacy.contentEl` when a new container is created.

### `src/pages/EmenuNewEditor.tsx`

**Fix 4 — Currency recovery chain:**
- Add `getSiblingCurrencyAffix(card)` helper that scans sibling `[data-product-role="price"]` elements for a valid currency prefix/suffix.
- Add `getSurfaceCurrencyAffix()` that reads the surface's configured currency from the editor state.
- Update `formatProductPrice` to use a 3-step fallback: (1) current card affix, (2) sibling affix, (3) surface currency. Never return bare digits.
- Pass the card element and surface currency into the save handler so this chain works.

### `src/components/commerce/emenuCartBridge.ts`

**Fix 5 — Reliable live CTA injection:**
- Move `card.setAttribute('data-cart-processed', 'true')` AFTER the `isNaN(priceNum)` check, so failed cards can be retried on the 2s/5s timeouts.
- Update `findNameEl` and `findPriceEl` to check `data-product-role` attributes FIRST (matching the editor's output), falling back to heuristics only if those aren't present.
- Add a guard in `isProductCard` to reject elements that contain nested product cards (prevent wrapper-level injection).

---

## No Changes To
- Card layout or styling
- Checkout flow
- Currency systems beyond the broken first-card recovery
- Any Eshop code
- `editorHtml.ts` (not needed — the sanitize boundary is stable)
- Any other builder systems

## Expected PASS/FAIL Outcomes
| Check | Expected |
|-------|----------|
| First card currency | PASS — fallback chain recovers from corrupted text |
| Popup open | PASS — card click sends `product-edit-request` |
| Edit/delete controls | PASS — pencil/trash buttons still work, card click is additive |
| Duplicate text removed | PASS — legacy content cleared before re-creation |
| Live CTA restored | PASS — `data-cart-processed` only set after valid parse |
| No recursive repair loop | PASS — no `notifyHtmlUpdate` from repairs, MutationObserver guarded |

