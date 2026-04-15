

## Fix: Live CTA "Add Item" Buttons Not Appearing

### Root Cause

Two bugs in `emenuCartBridge.ts` prevent buttons from rendering:

1. **Null crash on line 197**: When `priceEl` is `null` (cards without a recognizable price element), accessing `priceEl.parentElement` throws an error that silently kills the entire bridge script — no buttons appear on ANY card after that point.

2. **Early bail-out on line 113**: `if (isNaN(priceNum) || priceNum <= 0) return;` skips button creation entirely when price can't be parsed. The button should still render — it just won't send a price to cart.

### Fix (single file: `src/components/commerce/emenuCartBridge.ts`)

**Change 1** — Line 113: Instead of `return`, set a fallback price (0) and still create the button. The button will still work for external_url and whatsapp actions, and for checkout it will at least add the item.

**Change 2** — Line 197: Change `priceEl.parentElement || card` to just `card` when `priceEl` is null. This prevents the null reference crash.

```
// Line 113: Remove the bail-out, use fallback
if (isNaN(priceNum) || priceNum <= 0) priceNum = 0;

// Line 197: Guard against null priceEl  
var lastChild = (priceEl && priceEl.parentElement) ? priceEl.parentElement : card;
```

No other files need changes. The CSS exclusion for `.yangu-live-cta` is already in place in `PublishedEmenuFrame.tsx`.

### Expected Result
All product cards on the live published page will show the "+ Add" (or configured CTA) button.

