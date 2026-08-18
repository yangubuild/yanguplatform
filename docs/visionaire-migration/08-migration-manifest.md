# Visionaire — Migration Manifest (N, O, Q, R)

## N. COPY EXACTLY (no edits)

**Pages** — `src/pages/dashboard/visionaire/` (18 files):
`VisionaireHome.tsx`, `VisionaireBundles.tsx`, `VisionaireBundleDetail.tsx`, `VisionaireItemDetail.tsx`, `SavedProducts.tsx`, `ProductRequests.tsx`, `SpecialDeals.tsx`, `BookCoverTemplates.tsx`, `ProductMockups.tsx`, `EvergreenProblems.tsx`, `EvergreenProblemDetail.tsx`, `DigitalProductUniversity.tsx`, `UniversityCourseDetail.tsx`, `UniversityLessonViewer.tsx`, `PDFRebrander.tsx`*, `ProductDescriptions.tsx`, `ProductIdeas.tsx`, `BookTitleGenerator.tsx`.
(*`PDFRebrander.tsx` is COPY + MODIFY — see O.)

**Components**: `src/components/visionaire/VisionaireGrid.tsx`, `VisionairePageContainer.tsx`, `CompletedProducts.tsx`, `mockups/BoxMockupGallery.tsx`, `mockups/BoxMockupEditor.tsx`.

**Data**: `src/data/university/` (whole tree: `masterclass-courses.ts`, `master-library-lessons.tsx`, `visionaire-library.json`, `course-content/course-1..7-content.tsx`, `course-content/index.ts`), `src/data/evergreen-problems.json`.

**Libs / hooks**: `src/hooks/useVisionaireItems.ts`, `src/lib/driveUtils.ts`, `src/lib/typography.ts`, `src/lib/utils.ts`, `src/hooks/useAuth.tsx`, `src/hooks/useDebounce.ts`.

**Styling**: the `:root`/`.dark` token block and Lufga `@font-face` rules from `src/index.css`; `tailwind.config.ts`; `public/fonts/Lufga-*.otf` (18 files).

**Assets**: `src/assets/university/**` (16 files), `src/assets/mockups/**` (24 files), `src/assets/products/**` (8 files), `src/assets/custom-ebook-promo.jpg`.

**Edge functions**: `supabase/functions/visionaire-llm/`, `drive-download-proxy/`, `drive-ingest-library/`, `drive-fix-ebook-covers/`, `drive-debug-folders/`, `_shared/require-auth.ts`.

**shadcn/ui**: button, input, badge, select, dialog, textarea, label, skeleton, tooltip, sonner/toaster.

## O. COPY + MODIFY (6 files)

| File | Required change |
| --- | --- |
| `src/components/visionaire/VisionaireItemCard.tsx` | Remove `useUnlockGate` + `ActionKey` imports, `getDownloadActionKey`, `attemptDownload` and `{UnlockDialog}`; call `handleDriveDownload(item.download_url)` directly. |
| `src/pages/dashboard/visionaire/VisionaireItemDetail.tsx` | Same unlock-gate removal on its download button. |
| `src/pages/dashboard/visionaire/PDFRebrander.tsx` | Remove the `export_pdf` unlock gate; point the upload at the new project's `visionaire-uploads` bucket. |
| `src/config/dashboardNav.ts` | Extract only the Visionaire subtree into a new standalone `visionaireNav.ts`. |
| `src/App.tsx` | New router: flatten `/dashboard/visionaire/*` → `/*`, drop `ProtectedRoute`/`AllowlistGate`/onboarding, keep the 20 route paths. |
| `src/index.css` | Keep tokens + fonts; strip non-Visionaire utility/keyframe blocks. |

## DO NOT COPY

`src/features/agents/**`, `src/pages/manage/**`, `src/pages/offline/**`, `src/pages/developers/**`, all builder/surface/emenu code (`src/lib/builder/**`, `SurfaceEditor.tsx`, `BuilderPage.tsx`, template folders in `public/templates/**`), commerce/cart/orders, social-media module + `src/services/socialMedia/**`, explore/discovery, MCP (`src/lib/mcp/**`), ads (`src/lib/ads/**`), affiliates, agency, landing/marketing pages, `src/hooks/useUnlockGate.tsx`, `src/components/auth/AllowlistGate.tsx`, `src/integrations/supabase/client.ts` + `types.ts` (auto-generated), `.env`, `src/components/brand/YanguLogo.tsx`, all `learning_*` and non-Visionaire tables.

## Q. Database migration plan

Order of operations in the new project:

1. Enable Lovable Cloud.
2. Migration 1 — create the 5 tables with `GRANT`s, RLS enabled and the policies documented in `03-database-and-auth.md`, plus `updated_at` triggers and the recommended indexes (`category`, `type`, `is_active`, GIN on `tags`, unique partial on `slug`).
3. Migration 2 — `profiles` + `user_roles` + `has_role()`; admin write policies on `visionaire_items` and `visionaire_product_requests`.
4. Create buckets `visionaire-assets` (public) and `visionaire-uploads` (private, owner-scoped `storage.objects` policies on `{auth.uid()}/…`).
5. Seed: run `/mnt/documents/visionaire-migration/data/visionaire_items_seed.sql` (660 rows; filter `category = 'vls'` out — 23 rows). Then `visionaire_product_requests` with `user_id` nulled.
6. Set secrets: `GOOGLE_PLACES_API_KEY`, optionally `GOOGLE_DRIVE_CLIENT_ID`/`_SECRET`.
7. Deploy the 5 edge functions; run `drive-ingest-library` once to re-verify Drive ids and (new) mirror thumbnails into `visionaire-assets`.

Exported files already available:
`/mnt/documents/visionaire-migration/data/visionaire_items.csv`, `visionaire_items_seed.sql`, `visionaire_product_requests.csv`, `visionaire_request_votes.csv`, `visionaire_user_saves.csv`.

## R. Post-migration verification checklist

1. Library loads 595 active items; category and format filters populate from data.
2. Search matches on title, description and tags.
3. Sort options all reorder correctly; Recently Viewed persists across reload.
4. Card thumbnails render for Drive, googleusercontent and entrepedia sources; the icon placeholder appears when all fail.
5. Download works through `drive-download-proxy` for an ebook, an audio file and a bundle child; no Drive interstitial; fallback `window.open` still functions.
6. Save → appears in Saved; unsave → removed. Signed-out user cannot save.
7. Item detail shows related items from the same category.
8. Bundles grid renders gradients for art-less bundles; bundle detail lists Drive children.
9. Special Deals shows the 8 deal rows.
10. Product Requests: submit (auth), upvote once, count increments, second vote blocked.
11. Book Covers renders 120 tiles; Product Mockups external links open; Box Mockup editor loads all 21 images and exports.
12. Evergreen Problems lists 27 records and each detail slug resolves.
13. University: 7 tracks → course detail → lesson viewer prev/next through every lesson of all 7 courses.
14. All three AI tools return output and write a history row to `visionaire_tool_runs`.
15. PDF Rebrander uploads to the private bucket and exports the cover PNG.
16. RLS: signed-out user can read items but not saves/votes/tool runs; user A cannot read user B's saves or tool runs.
17. Mobile 360–414px: single-column grids, no horizontal scroll on any of the 20 routes.
18. Dark theme tokens match the HEX table in `02-design-system.md`; Lufga loads (no fallback flash).
19. No console errors, no residual imports of `useUnlockGate`, `AllowlistGate` or Yangu nav.
20. SEO: title, meta description, canonical and single H1 on public routes.
