

## Audit: What gets published — emenu vs eshop/other categories

### When user clicks Publish in **EMENU** editor (`EmenuNewEditor`)
1. Opens `BuilderPublishModal` (full modal: Page Title, SEO Description, Favicon, Cover Image, domain selector, slug).
2. Calls Supabase RPC `request_publish_surface` → creates row in `builder_publishes`.
3. `syncPublishedRecord` (useBuilderPublish.ts L168-210) writes `published_schema.surface` with:
   - `surface_type: "emenu"`
   - `slug`, `favicon_url`, `show_yangu_badge`
   - **`emenu_html`** = sanitized full-page HTML from `metadata.builder_new_html` / `pages_html` (blob URLs persisted to storage).
4. **Live runtime** (`PublicSurfacePage` L103 / `SurfaceViewer` L98-118): detects `surface_type === "emenu"` → renders `EmenuPublicView` which mounts `PublishedEmenuFrame` (iframe `srcdoc={emenu_html}`) wrapped in `PublicCommerceShell` (cart bridge, checkout).
5. **Result**: 1:1 pixel parity with the editor canvas — exact HTML the user designed.

### When user clicks Publish in **ESHOP / ESITE / ESTORE / INFLUENCER / COMMUNITY**
Two divergent paths exist in the codebase right now:

**Path A — from the unified editor (`EmenuNewEditor`, reached via `/builder/:surfaceId`)**
- Same `BuilderPublishModal` opens, same `request_publish_surface` RPC, same `syncPublishedRecord`.
- BUT `syncPublishedRecord` L178 only writes `emenu_html` when `surfaceType === "emenu"`. For eshop/etc. it writes only: `id, slug, surface_type, favicon_url, show_yangu_badge`.
- **No `pages_html` and no section schema is copied into `published_schema`.**
- Live runtime (`PublicSurfacePage` L121-128) falls back to `schema.pages[0].sections` and renders via `PREVIEW_MAP` section components — which is the **legacy section-based renderer**, NOT the actual HTML the user edited in the canvas.
- **Result**: live eshop surface shows a generic section-based render that does NOT match what the user built in the canvas (the canvas works in `pages_html` HTML, just like emenu).

**Path B — from `BuilderNewPage` onboarding chat (the "Publish" button in the chat step before entering editor)**
- Opens `BuilderPublishDialog` (`src/components/builder-new/BuilderPublishDialog.tsx`).
- This is a **fake/stub modal**: 1.5s `setTimeout`, fires `toast.success("Website published!")`, **no RPC, no DB write, nothing published**. URL shown is hardcoded `${slug}.shop` / `.site`.
- **Result**: nothing is actually published. Pure dead UI.

### Side-by-side

| Step | Emenu | Eshop / Esite / Estore / Influencer / Community |
|---|---|---|
| Modal opened | `BuilderPublishModal` (real) | `BuilderPublishModal` (real, in editor) **or** `BuilderPublishDialog` (fake stub, in onboarding) |
| RPC called | `request_publish_surface` ✅ | `request_publish_surface` ✅ (editor) / **none** (onboarding stub) |
| `published_schema.surface.emenu_html` | ✅ full sanitized HTML written | ❌ **NEVER written** (gated by `if (surfaceType === "emenu")`) |
| `published_schema.pages[].sections` | n/a (HTML path) | Whatever the legacy schema has — not synced from `pages_html` |
| Live render path | iframe `srcdoc` of real HTML, with cart bridge | Legacy section renderer via `PREVIEW_MAP` — **does not match canvas HTML** |
| Parity with editor canvas | 1:1 exact | ❌ broken — live page is a generic section render, not the user's edited HTML |
| Fake dialog still wired anywhere | n/a | ✅ `BuilderNewPage` still imports & renders `BuilderPublishDialog` (dead UI) |

### Two concrete bugs surfaced
1. **`syncPublishedRecord` only persists HTML for emenu.** Eshop/esite/estore (which now also use the unified `pages_html` HTML editor) publish an empty/legacy schema → live surface ≠ editor canvas.
2. **`BuilderPublishDialog` (fake stub) still exists and is rendered by `BuilderNewPage`.** Violates zero-dead-controls policy and contradicts the "single emenu publish modal globally" rule.

### Recommended fix (for approval — implementation in default mode)
1. In `useBuilderPublish.ts` `syncPublishedRecord`, remove the `if (surfaceType === "emenu")` gate so that **all categories** persist `emenu_html` (rename internally to `published_html` later; keep field name for now to avoid runtime breakage).
2. Update `PublicSurfacePage` and `SurfaceViewer` to render the iframe HTML path for any surface that has `published_schema.surface.emenu_html` (not just `surface_type === "emenu"`), keeping commerce shell active for `eshop / estore / store_listing`.
3. Delete `src/components/builder-new/BuilderPublishDialog.tsx` and remove its import + render from `BuilderNewPage.tsx`. The Publish button in onboarding should either route to the real editor's publish flow or be hidden until the surface is initialized.
4. Verify on a freshly-built eshop: edit canvas → Publish → live URL shows identical HTML with working cart.

