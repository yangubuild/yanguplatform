
Scope: editor-only fix in `src/components/builder-new/EditablePreview.tsx`. No changes to live bridge, renderers, or published output.

## Implementation

**1. Replace `removeDuplicateTitleNodes` with `normalizeRoleScopedDuplicates`**

New role-scoped normalizer that ONLY removes duplicates within the same `data-product-role` group:

- Find all `[data-product-role="title"]` nodes inside the card → keep first, remove rest if their normalized text equals the first.
- Find all `[data-product-role="price"]` nodes inside the card → keep first, remove rest if their normalized text equals the first.
- Never touch nodes without role attributes.
- Never parse/modify composite strings (e.g. `"$92 Yellow Sunglasses Look"`).
- Never strip text from the kept node.

**2. Strict card detection (`isLikelyProductCard`)**

Priority order:
- PRIMARY: element has `data-product-card="true"` → valid card.
- FALLBACK: existing conservative heuristic (image + title/price element), but only when no `[data-product-card]` markers exist anywhere in the document. If unsure → return false (safe mode).

**3. Control attachment guard**

In the control injection loop:
- If any `[data-product-card="true"]` exists in the doc, only attach controls to those nodes.
- Walk up to the nearest `[data-product-card="true"]` ancestor; if the candidate IS that ancestor, attach. Otherwise skip.
- Never attach to elements containing `h1/h2/h3` or nested anchors-with-images (existing guard preserved).

**4. Safe-mode principle**

Wrap all normalization in a confidence check:
- If card has no `[data-product-role]` children AND no clear single title/price element → DO NOTHING. Leave DOM untouched.

**5. Dev-only contract warning**

In `import.meta.env.DEV` only, log a one-time `console.warn` per surface if cards are detected without `data-product-card`/`data-product-role` markers. No runtime impact.

**6. Preserved behavior (untouched)**

- Edit/delete icon UI, placement, and styling.
- Live bridge `emenuCartBridge.ts`.
- Published rendering path.
- Template renderer files.
- Magic Editor, ADA, and all other editor systems.

## Files

- Modify: `src/components/builder-new/EditablePreview.tsx` (only the card detection, dedupe, and control-attachment helpers).

## Verification

After implementation, audit `/builder/46caf8ea-43f6-436d-8335-2a229a937400`:
- Confirm "$92 Yellow Sunglasses Look" appears once per card.
- Confirm "$64 Soft Curls Beauty" appears once per card.
- Confirm edit/delete icons remain on each of the 4 product cards.
- Confirm no controls on section headers / grid wrapper.
- Spot-check one eMenu template (e.g. Plateria) to confirm no regression.
- Confirm live `/joanna` page is unchanged.
