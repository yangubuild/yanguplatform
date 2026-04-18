
The user's screenshot shows the live `/joanna` eshop has serious bugs in the Products grid:

1. **Card 1 (Pink Bucket Hat & Jacket, $78)**: Name + price OK, but **NO + Add button**, no heart, no delivery strip.
2. **Card 2 ($92)**: **Price shown FIRST instead of name**, name "Yellow Sunglasses Look $92" appears DUPLICATED below (price embedded in name), AND a third "Yellow Sunglasses Look $92" duplicate. + Add button is present but floating awkwardly. Heart present.
3. **Card 3 (Pink Sunglasses Editorial)**: Name only, **NO price, NO button, NO delivery strip**. Heart present.
4. **Card 4 ($64 / Soft Curls Beauty)**: **Price first**, name "Soft Curls Beauty $64" duplicated, then "Soft Curls Beauty" again, then "$64" again. **NO + Add button**. Heart present.

## Root cause analysis

Two distinct bugs are compounding:

### Bug A — Duplicate name/price text
The cart bridge (`emenuCartBridge.ts`) is **injecting name + price text nodes** into cards that already contain that text in the source HTML. The bridge should ONLY inject the action UI (button, heart, delivery strip) and never re-render name/price. Cards that already have name/price end up with 2–3 copies.

### Bug B — Missing + Add buttons on 3 of 4 cards
The current `findCandidateProductCards()` logic only injects the button on cards where it finds a clean structural match (img + heading). When name/price markup is irregular (price-as-heading, or name without price), the leaf detection skips the card entirely. Only Card 2 got a button because its structure matched.

### Bug C — Card ordering (name vs price)
Per locked memory `mem://commerce/product-card-layout-and-editor`: **universal layout = name/desc above, price LEFT / button RIGHT**. The bridge isn't normalizing card order — it's leaving raw template HTML where price appears as the first heading.

## Fix plan

**File: `src/components/commerce/emenuCartBridge.ts`**

1. **Stop injecting any text content.** Remove ALL code paths that write product name or price into the card. The bridge injects ONLY: heart icon (top-right), + Add button (bottom-right of footer), delivery strip (below footer). Name/price come from the template HTML, period.

2. **Normalize card footer structure on inject.** For each detected product card:
   - Find the card's text block (everything below the image).
   - Detect name (longest non-price text node) and price (text matching `/[$€£₦KSh]\s*\d/`).
   - Wrap them in a flex row: `<div class="yangu-product-footer flex items-center justify-between gap-2">` with name on left, price+button on right.
   - This guarantees **name → price-LEFT → button-RIGHT** layout per the locked spec.
   - Strip duplicate text nodes that match the detected name or price (prevents the "Soft Curls Beauty" tripled text).

3. **Inject + Add button on EVERY detected product card unconditionally.** Remove the structural gate that's currently skipping 3 cards. If `findProductSections()` flagged the card as a product, it gets a button. Period.

4. **Mobile vs desktop layout:** Use Tailwind responsive classes on the injected wrapper — `flex-col md:flex-row` so mobile stacks (name → price → button vertically) and desktop is horizontal (name | price + button).

5. **Idempotency guard:** Tag injected wrapper with `data-yangu-injected="true"` and skip cards already containing this attribute on re-runs (prevents duplicate buttons on re-mount).

6. **Remove duplicate name nodes:** After detecting the canonical name, query the card for any other text nodes whose content === name and remove them. Same for price.

## Verification (after editing)

After applying the fix in default mode, navigate to `https://yangu.shop/joanna` and confirm:
- All 4 cards have exactly ONE name, ONE price, ONE + Add button, ONE heart.
- Layout: name top, price LEFT + button RIGHT below on desktop; vertical stack on mobile.
- Delivery "Get it by…" strip renders under each card.
- No stray button near the "Made in yangu" badge.

Then audit the editor at `/builder/46caf8ea-43f6-436d-8335-2a229a937400` and confirm each of the 4 cards shows edit/delete icons, and that desktop header Account / Wishlist / Cart links remain active.
