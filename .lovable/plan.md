

## Fix: Live Header Cart & Product Buttons

### Root Causes

1. **Cart button oversized / breaking nav**: The CSS rule `#yangu-cart-btn { padding:12px 24px !important }` (line 27-32 of `PublishedEmenuFrame.tsx`) overrides the bridge's inline `padding:4px 8px` when the cart is placed inline in the nav. The generic `button:not(.yangu-live-cta)` rule (line 78-81) also matches it, forcing `padding:10px 20px !important`.

2. **"+ Add" buttons potentially blocked**: If `addCartButton()` throws (e.g. nav structure doesn't match expectations), the error kills the entire IIFE before `initCartBridge()` can run — because `initCartBridge()` and `addCartButton()` execute sequentially with no error isolation.

### Changes (2 files only)

**File 1: `src/components/routing/PublishedEmenuFrame.tsx`**
- Replace `#yangu-cart-btn` block (lines 27-32) with `.yangu-cart-fallback` class — only targets the fixed-position fallback mode
- Exclude `#yangu-cart-btn` from `button:not(.yangu-live-cta)` rules on both desktop (line 78) and mobile (line 127) by adding `:not(#yangu-cart-btn)`

**File 2: `src/components/commerce/emenuCartBridge.ts`**
- Reorder execution: call `initCartBridge()` BEFORE `addCartButton()` (lines 317-323) so product buttons always render
- Wrap `addCartButton()` in `try/catch` so nav placement failure can't kill product buttons
- Add `.yangu-cart-fallback` class only in the fallback (fixed-position) branch
- Add `!important` to inline nav mode padding (`4px 8px !important`) to win over any stray CSS

### What is NOT changed
- No other files touched
- No cart behavior changes
- No editor changes
- No header/card redesign
- No mobile layout changes

### Verification checklist
- `initCartBridge()` runs even if `addCartButton()` fails ✓ (reorder + try/catch)
- Cart fallback CSS scoped to `.yangu-cart-fallback` only ✓
- PASS/FAIL on live published page: + Add visible, Cart visible after Contact, Cart not oversized, nav intact

