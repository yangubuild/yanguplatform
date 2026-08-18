# Visionaire Extraction & Independent-Project Migration Audit

Inspection and documentation only. No code, database, RLS, asset, or route changes.

## Answer to your first question (based on what I already verified in this project)

**Yes — Visionaire can be duplicated, and the safest path is Remix-then-strip, not rebuild-from-spec.**

Verified facts behind that recommendation:

- Visionaire is unusually self-contained: 18 pages in `src/pages/dashboard/visionaire/`, 4 components in `src/components/visionaire/` (+ a `mockups/` folder), one hook (`src/hooks/useVisionaireItems.ts`), one util (`src/lib/driveUtils.ts`), one edge function (`supabase/functions/visionaire-llm`), and course content under `src/data/university/`.
- Its data lives in only 5 owned tables: `visionaire_items` (721 rows across 21 categories), `visionaire_product_requests` (63 rows), `visionaire_request_votes`, `visionaire_user_saves` (2 rows), `visionaire_tool_runs` (0 rows). RLS is simple: public read of active items, per-user saves/tool-runs, authenticated request creation/voting.
- Content files already live in Google Drive, not in this project: all 435 `download_url` values point at `drive.google.com`; covers come from `lh3.googleusercontent.com` (195), `entrepedia-products.com` (121), `drive.google.com` (42). Both `visionaire-assets` and `visionaire-uploads` buckets currently hold **0 objects**. So the library files themselves are not at risk during separation — the risk is the metadata catalog and the in-repo images (`src/assets/university/*`, promo art).
- The Drive folder you linked is already referenced in this project (a migration sets it as `source_url` for the `bundles` category), and there is an existing Drive pipeline: `drive-connect`, `drive-callback`, `drive-ingest-library`, `drive-download-proxy`, `drive-fix-ebook-covers`, `drive-debug-folders`, plus a `drive_tokens` table.
- Yangu couplings that would break on a raw copy: `useAuth`, the dashboard shell/sidebar (`src/config/dashboardNav.ts`), `useUnlockGate` + the ads/credits unlock matrix used by the download button, the shared shadcn/Tailwind token layer, and `LOVABLE_API_KEY`-based AI in `visionaire-llm`.
- Digital Product University is **not** backed by the `learning_*` tables — it renders hardcoded TSX content and imported images. That will be documented as static content, not a course engine.

## What I'll produce

A written audit package, delivered as files plus a chat summary in your requested A–T order.

In-repo docs (new folder, nothing existing touched):

- `docs/visionaire-migration/00-executive-summary.md` — A, B, P
- `docs/visionaire-migration/01-architecture-and-routes.md` — C, D (every route incl. non-sidebar/child routes), E
- `docs/visionaire-migration/02-design-system.md` — F: real HEX values pulled from `src/index.css` / `tailwind.config.ts` (no guessed colors), fonts, sizes, radii, spacing, shadows, sidebar/content widths, grid, breakpoints, icon set, transitions
- `docs/visionaire-migration/03-database-and-auth.md` — G, H: full column lists, indexes, FKs, RLS policy text, row counts, per-table COPY / RECREATE / SHARED / DO-NOT-MOVE verdict, and user-migration strategy
- `docs/visionaire-migration/04-assets-and-drive.md` — I, J: asset inventory (name, type, path, usage, Visionaire-specific vs shared, copyable vs recreate, Drive-resident or not) and the recommended Drive → catalog DB → frontend architecture
- `docs/visionaire-migration/05-features.md` — library discovery/search/sort/filters, card actions (Open / Download / Save) traced to actual handlers, Bundles, Saved, Product Requests, Special Deals, Evergreen, Mockups, Book Covers
- `docs/visionaire-migration/06-tools-and-university.md` — K, L: per-tool input → processing → model/function → storage → output, env-var names only (no secrets), and explicit placeholder flags
- `docs/visionaire-migration/07-yangu-dependency-map.md` — M: dependency → reason → migration solution
- `docs/visionaire-migration/08-migration-manifest.md` — N, O, Q, R: file-by-file COPY EXACTLY / COPY + MODIFY / REBUILD / DO NOT COPY with real paths, independent architecture, ordered migration sequence (copy → verify → launch → only then disconnect), verification checklist
- `docs/visionaire-migration/09-master-build-prompt.md` — S: the single paste-ready prompt for the new Lovable project
- `docs/visionaire-migration/manifests/*.json` — T: routes, components, schema, assets, env vars, integrations, design tokens, dependencies, features, migration checklist

Data snapshots written outside the repo, to `/mnt/documents/visionaire-migration/`:

- CSV exports of the 5 Visionaire tables (read-only `COPY ... TO STDOUT`), so the new project can be seeded without re-scraping Drive
- `visionaire_items.sql` insert-ready seed file

## Technical notes

- All findings come from reading files and running read-only `SELECT`s. No migration tool calls, no `UPDATE`/`DELETE`, no RLS edits, no file moves, no deletions in `src/`.
- Where something is hardcoded, mock, or a placeholder (e.g. University lesson content, any tool without a backing function), it will be labelled as such rather than described as working.
- Secrets are never printed — only env-var names such as `LOVABLE_API_KEY` and the Drive OAuth variables.
- The Yangu app keeps working exactly as today; Visionaire stays fully wired into `/dashboard/visionaire`.
