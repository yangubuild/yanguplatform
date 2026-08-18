# Visionaire — Executive Summary (A, B, P)

Audit date: 2026-08-18. Source of truth: this repo + read-only queries against the Lovable Cloud database. Nothing was changed.

## A. Can Visionaire be duplicated directly?

**Yes.** Visionaire is one of the most self-contained modules in the platform.

| Question | Answer |
| --- | --- |
| Can the exact app be duplicated into a new Lovable project? | Yes — remix this project, then delete non-Visionaire code. Design and behaviour are preserved bit-for-bit. |
| Can we fork and strip? | Yes, and this is the recommended path. |
| Safer than rebuilding from a spec? | Yes. A spec rebuild re-guesses 18 pages, 660 catalog rows and 6 Drive functions. |
| Can source files be copied directly into another project? | Yes for the `visionaire/` folders; 6 files need dependency edits (see manifest). |
| Can schema + data be migrated? | Yes. 5 owned tables, small: 660 items (595 active), 63 product requests, 3 votes, 2 saves, 0 tool runs. CSV + SQL seed already exported. |
| Can books/PDFs/covers/courses/mockups be preserved? | Yes. They are **not stored in this project**. All 435 `download_url` values point to Google Drive; covers are hosted on `lh3.googleusercontent.com` (195), `entrepedia-products.com` (121), `drive.google.com` (42). Both Visionaire storage buckets contain **0 objects**. The only in-repo art is ~45 images under `src/assets/university`, `src/assets/mockups`, `src/assets/products`, plus `custom-ebook-promo.jpg`. |
| What depends on Yangu today? | Auth (`useAuth`), dashboard shell + sidebar, `useUnlockGate` (ads/credits gate on downloads), shared shadcn/Tailwind token layer, `LOVABLE_API_KEY` AI gateway, Drive OAuth secrets, `drive_tokens` table. |
| What already works independently? | The whole catalog read path (public RLS `SELECT` on active items), Book Covers (external CDN, no DB), Evergreen Problems (local JSON), University (local TSX content), Product Mockups (local assets + AI editor). |
| What breaks on a naive copy today? | Download button (`useUnlockGate` import chain), auth-dependent pages (Saved, Requests, PDF Rebrander), `visionaire-llm` without `LOVABLE_API_KEY`, Drive downloads without `GOOGLE_PLACES_API_KEY`, PDF uploads without the `visionaire-uploads` bucket. |

## B. Recommended migration method

**Remix → strip → reconnect → verify → launch → only then disconnect from Yangu.**

1. Remix this project in Lovable (sidebar/project menu → Remix). This carries the exact codebase, design tokens, fonts and assets.
2. In the remix, enable Lovable Cloud (fresh backend), then create the 5 Visionaire tables + 2 buckets with the same RLS.
3. Seed the catalog from `/mnt/documents/visionaire-migration/data/visionaire_items_seed.sql`.
4. Delete every non-Visionaire route/page/feature in the remix (see the DO NOT COPY list).
5. Re-point the 6 COPY + MODIFY files (remove `useUnlockGate`, dashboard shell, Yangu nav).
6. Re-add secrets: `LOVABLE_API_KEY` (auto), `GOOGLE_PLACES_API_KEY`, `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`.
7. Verify against the checklist in `08-migration-manifest.md`.
8. Only after the independent app is verified live, remove Visionaire from Yangu (optional).

If remixing is not available, use `09-master-build-prompt.md` in a new project and paste the seed SQL — the fallback path, not the primary one.

## P. Migration risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Drive links break because the new project's Drive credentials differ | High | Files are served via `drive-download-proxy` using an API key + public sharing. Keep the library folder link-shared and configure `GOOGLE_PLACES_API_KEY` in the new project before launch. |
| `entrepedia-products.com` covers (121 items + Book Covers page + Completed Products strip) are on a third-party host | High | Not controlled by this project. Mirror those images to Drive or storage before that host changes. This is the single biggest content-loss vector. |
| Catalog metadata loss | Low | Already exported as CSV + SQL seed. |
| User data loss (2 saves, 63 requests) | Low | Requests reference Yangu `auth.users` ids; import with `user_id` nulled or remapped. |
| `visionaire_items` has no `updated_at`, no FK to bundles/courses, `content` is free-form jsonb | Medium | Documented in `03-database-and-auth.md`; recommended additions listed there — do them in the new project, not here. |
| Download unlock behaviour disappears when `useUnlockGate` is dropped | Low | Intentional: downloads become direct in the independent app unless monetisation is re-added. |
| University/Evergreen content lives in TSX/JSON, not the DB | Medium | Copy the files verbatim; migrating them into the DB is a post-launch project. |
