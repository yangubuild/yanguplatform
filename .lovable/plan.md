
## What I verified (no edits made)

- Live deployment from here: `x-deployment-id: a2f25c41-7e1a-4d45-af03-fda75f66f9b3` (your reported `ef3c414b-…` is newer / a different CF region; both serve the same main bundle `index-BnRhEVpV.js`).
- The chunk `neutralizePlaceholderLinks-Kwn0IiSy.js` exists on the live bundle and DOES contain all three markers (`yangu-placeholder-link`, `data-yangu-placeholder-form`, `event.preventDefault();event.stopPropagation`). So the code is shipped.
- BUT on `https://yangu.store/jojom` the rendered iframe’s `contentDocument` shows:
  - 0 `<link rel="stylesheet">` tags pointing at `/templates/bazaro-classic/`
  - 3 anchors total (no Bazaro stylesheets, no Bazaro menu anchors as `<a>`)
  - 0 anchors with `data-yangu-placeholder-link`
  - title is `"JOJOM "` (not `"JOJOM — Wholesale Store"` that the source renderer would produce)
- The iframe element in the React tree has no `className` and no `srcdoc` attribute (different from the React element produced by the Bazaro-classic iframe branch in `SurfaceViewer.tsx` / `PublicSurfacePage.tsx`).

## Root cause

`/jojom` on `yangu.store` is resolved by `PublicRouteResolver` → `SurfaceViewer`. `SurfaceViewer` only calls `neutralizePlaceholderLinks` when `isBazaroClassicSnapshot` is true, which is decided by:

```ts
surfaceMeta.builder_new_template === "estore_bazaro_classic" ||
surfaceMeta.design_template === "estore_bazaro_classic" ||
(typeof rawHtml === "string" && rawHtml.includes("/templates/bazaro-classic/"))
```

For the JOJOM surface this is false at runtime:
- `builder_new_template` / `design_template` are not set to that string in `published_schema.surface` for jojom.
- The stored `pages_html[home]` no longer contains the `/templates/bazaro-classic/` substring — DOMPurify-and-friends in the publish path stripped all `<link>` stylesheets at publish time (we see 0 links in the contentDocument), and the editor’s save pipeline already strips/rewrites those asset URLs.

So the “Bazaro Classic iframe” branch is skipped. The HTML still ends up inside an iframe because the stored snapshot itself contains an `<iframe>` element (DOMPurify’s `ADD_TAGS: ["iframe"]` allows it through), so it renders as an embedded iframe inside the inline-HTML branch — which never calls `neutralizePlaceholderLinks`. That iframe’s placeholder anchors/forms remain unmodified, and clicking them navigates the inner `about:srcdoc` document, which is what produces the Yangu fallback shell takeover you saw.

## The fallback shell flash

On a fresh load, `index.html` is shipped with the global `<title>YANGU — All-in-One AI Platform…</title>` and meta. Before `PublicRouteResolver` finishes RPC resolution, React paints `resolverFallback` (an empty `<div>`) but the document title/meta are still the SPA defaults — that’s the 1–2s “generic Yangu page” flash. It’s not a render of `Index`, it’s the original shell metadata staying visible while the route resolves.

## Plan

Two narrowly scoped fixes, no other systems touched.

### 1. Make neutralization fire on every srcdoc/inline injection path

In `src/components/routing/SurfaceViewer.tsx` and `src/pages/PublicSurfacePage.tsx`:

- Stop gating `neutralizePlaceholderLinks` on `isBazaroClassicSnapshot`. Run it unconditionally on `clean` for both branches:
  - the Bazaro-classic iframe `srcDoc` branch (already does)
  - the inline `dangerouslySetInnerHTML` branch (currently does not)
- Extend `neutralizePlaceholderLinks` to also rewrite any nested `<iframe srcdoc="…">` it finds: parse the inner srcdoc string, neutralize anchors/forms inside it, re-serialize, and put it back as the iframe’s `srcdoc` attribute. This handles the JOJOM case where the snapshot stores an iframe-wrapped page.
- Also neutralize bare `<iframe src="#">` / `src=""` (set `src="about:blank"`).

No change to detection logic, no change to DOMPurify config, no change to publish pipeline, no change to commerce / routing / RLS / templates.

### 2. Eliminate the fallback-shell flash

In `src/components/routing/PublicRouteResolver.tsx`:

- When `fastPathRef.current === false` (i.e. we are about to resolve a public host route), synchronously clear `document.title` to an empty string and remove the generic `<meta name="description">` / OG defaults on first render, before resolution completes. `SurfaceViewer`/`PublicSurfacePage` already re-set them once data loads.
- Keep `resolverFallback` as a blank `<div>` — no spinner change.

This eliminates the visible “Yangu — All-in-One AI Platform…” title and any text from the default shell during the resolution window. It does not change route resolution, caching, or which component renders.

### Out of scope (explicitly not touched)

Security/RLS, other templates, payments, oversized images, chat, checkout, realtime, publish pipeline, DOMPurify config, builder editor.

## Verification I will run after the edit (build mode)

1. Rebuild + publish.
2. Hit `https://yangu.store/jojom` fresh (cache-busted) and via the browser tool:
   - Confirm `iframe.contentDocument` (and any nested `<iframe srcdoc>` inside it) now contains `data-yangu-placeholder-link` and `data-yangu-placeholder-form`.
   - Click the “Shop all” / `<a href="#">` anchor and assert `iframe.contentDocument.title` and `URL` do not change, and the Yangu shell does not take over.
   - Submit a placeholder form and assert the same.
3. Reload with empty cache and watch `document.title` over the first 2s — confirm the generic shell title never appears before the surface’s own title is set.
