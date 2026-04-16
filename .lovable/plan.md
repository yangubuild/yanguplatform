

## Root Cause

The cart button and "+ Add" buttons ARE being created by the bridge script — the JavaScript logic is correct. But **two CSS rules in `PublishedEmenuFrame.tsx`** override the inline styles and bloat the cart button into a full-width bar:

1. **Line 27-32**: `#yangu-cart-btn { padding:12px 24px !important }` — forces large padding even when placed inline in the nav
2. **Line 78-80**: `button:not(.yangu-live-cta) { padding:10px 20px !important }` — also matches `#yangu-cart-btn` since it lacks `.yangu-live-cta` class

The cart button's inline style `padding:4px 8px` loses to both `!important` rules. The button swells, breaks the flex layout, and pushes nav links out of view.

The "+ Add" buttons may also be affected if they're not rendering — the same `button:not(.yangu-live-cta)` rule could interfere, though they do have `.yangu-live-cta`. Need to verify `.yangu-live-cta` class is consistently applied.

## Plan (2 files)

### File 1: `src/components/routing/PublishedEmenuFrame.tsx` (CSS only)

- **Remove** the `#yangu-cart-btn` block (lines 27-32) entirely — the cart button styling should come from the bridge script inline styles, not from the global CSS
- **Add** `#yangu-cart-btn` to the exclusion list on the `button:not()` rule (line 78) so it becomes `button:not(.yangu-live-cta):not(#yangu-cart-btn)`
- Do the same for the mobile `button:not()` rule (around line 114)

### File 2: `src/components/commerce/emenuCartBridge.ts` (safety)

- In `addCartButton()` inline nav mode (line 271): add `!important` to the padding value so no stray CSS can override it
- Wrap `addCartButton()` in try/catch so if nav detection fails, it doesn't kill `initCartBridge()` (the "+ Add" buttons)
- Call `initCartBridge()` BEFORE `addCartButton()` (already the case, just verify)

### No other files changed. No redesign. No behavior changes.

### Expected result
- Header: Logo | Home | Menu | About | Contact | 🛒 Cart (0)
- Cart button: small, inline, right-aligned in nav
- "+ Add" buttons: visible on all product cards
- Navigation fully visible

