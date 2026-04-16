

## Fix: Duplicate Product Titles in Editor

### Root Cause

In `EditablePreview.tsx`, `normalizeLegacyProductCard` (line 584):

1. It finds the original title text via `getCardImageTitle(card)` — which reads from an `<h3>` or heading element in the card
2. It picks a `contentContainer` (a `<div>` or `<p>` inside the card) and clears it with `innerHTML = ''`
3. It creates a **new** `<span data-product-role="title">` inside that container
4. **But the original `<h3>` heading lives outside `contentContainer`** — it's a sibling or in a different wrapper — so it survives the `innerHTML = ''` clear
5. Result: two elements displaying the same product name

The save path in `EmenuNewEditor.tsx` (line 524-528) only deduplicates nodes with `[data-product-role="title"]` attribute, so the original untagged `<h3>` is never caught.

### Fix — 2 files only

**File 1: `src/components/builder-new/EditablePreview.tsx`**

In `normalizeLegacyProductCard`, after creating the new tagged title/price nodes (after line 620, before the description block):

- Query the card for all heading elements (`h1-h6`) and bold/strong elements whose `textContent` matches the new `nameEl.textContent`
- Remove any that are **not** the newly created `nameEl` and not inside `contentContainer`
- This eliminates the original source heading that was left behind

**File 2: `src/pages/EmenuNewEditor.tsx`**

In `handleProductSave`, after the existing dedup block (after line 528):

- Query the card for any `h1-h6, strong, b` elements whose trimmed text matches `trimmedName` but are **not** the current `nameElement`
- Remove those duplicate nodes
- This catches any untagged legacy headings that survived into the save path

### What does NOT change

- No layout/styling changes
- No cart/CTA/bridge changes
- No publishing logic changes
- No other files touched

### Confirmation checklist

- No other files changed: YES (only EditablePreview.tsx and EmenuNewEditor.tsx)
- Duplicate titles removed at both normalization and save path: YES
- Editor preview shows one title only per card: YES
- PASS/FAIL: will be confirmed after implementation

