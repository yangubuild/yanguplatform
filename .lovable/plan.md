<final-text>Do I know what the issue is? Yes.

The live CTA problem is not the price parser. The real published domain is going through `PublicRouteResolver -> SurfaceViewer`, and that emenu path currently renders `PublishedEmenuFrame` without the commerce shell, without `orderingEnabled`, without `currency`, and without the iframe `postMessage` bridge. On the real live page, the cart bridge is effectively never enabled, so no CTA buttons can appear there.

The duplicated product names are a second, separate bug in the product save/normalization path: some cards are ending up with both an existing title line and an extra saved title/description line, so the published HTML shows the name twice.</final-text>

1. Fix the actual live route, not the bridge internals first
- Update `src/components/routing/SurfaceViewer.tsx` so emenu surfaces use the same public-commerce runtime as `src/pages/PublicSurfacePage.tsx`.
- Wrap live emenu pages in `PublicCommerceShell`.
- Load the surface commerce config on that route and pass `orderingEnabled`, `currency`, and `onPostMessage` into `PublishedEmenuFrame`.
- Remove the current route drift so preview/live/custom-domain rendering all use one emenu commerce flow.

2. Make CTA insertion match the real card layout from the screenshot
- In `src/components/commerce/emenuCartBridge.ts`, stop appending the button to a brittle parent like `priceEl.parentElement`.
- Insert the CTA into the card body/content area, below the product text block, so it renders as a visible full-width product button on every card.
- Force block-level button layout for the live CTA so it cannot disappear inside a title/price row.

3. Fix the duplicated product-name bug at save time
- In `src/pages/EmenuNewEditor.tsx`, harden product save so it reuses the existing title node when possible instead of creating another title element.
- Before persisting, remove extra title-role nodes inside the same product card and strip any description text that starts with the exact product name.
- If needed, mirror the same normalization logic already used in `src/components/builder-new/EditablePreview.tsx` so repairs are persisted, not only cosmetic in the editor iframe.

4. Keep the emenu runtime consistent in one place
- If needed, extract the emenu public runtime into a shared component/helper used by both `PublicSurfacePage` and `SurfaceViewer`.
- This prevents future regressions where the preview path works but the real published domain silently skips commerce wiring.

5. Verify only on the real live runtime
- Test the published emenu through the resolved live route, not only the builder preview.
- Confirm:
  - every visible product card gets one CTA button,
  - the CTA sits inside the dark card content area under the text,
  - clicking it triggers add-to-cart and opens/shows cart behavior,
  - no card shows the product name twice.
- Republish after the fix, because the public page serves the latest published HTML.

Technical details
- Root live bug: `src/components/routing/SurfaceViewer.tsx`
- Shared working pattern to mirror: `src/pages/PublicSurfacePage.tsx` emenu branch
- Iframe renderer: `src/components/routing/PublishedEmenuFrame.tsx`
- CTA injector: `src/components/commerce/emenuCartBridge.ts`
- Duplicate-title save path: `src/pages/EmenuNewEditor.tsx`
- Editor normalization reference: `src/components/builder-new/EditablePreview.tsx`

Expected result
- Live published product cards show the CTA button on every card.
- The CTA is placed correctly and works with the cart.
- No product card shows a duplicated product title anymore.