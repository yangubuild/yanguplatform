# Visionaire — MASTER LOVABLE BUILD PROMPT (S)

Use this only if remixing is unavailable. Paste the whole block into a new Lovable project as the first message. Recommended path remains remix-and-strip (`00-executive-summary.md`).

---

Build **Visionaire**, a standalone digital-product library and creator toolkit. React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Query + React Router. Enable Lovable Cloud for auth, database, storage and edge functions. Deliver the whole app in one build.

## Design system (exact — do not substitute)

Dark theme by default, defined as HSL CSS variables in `index.css`, consumed only through semantic Tailwind tokens (never hardcoded colors):
`--background 150 20% 5%` · `--foreground 150 10% 95%` · `--card 150 15% 8%` · `--popover 150 15% 8%` · `--surface-elevated 150 14% 11%` · `--surface-sunken 150 20% 4%` · `--border 150 12% 15%` · `--input 150 12% 15%` · `--ring 150 12% 25%` · `--muted 150 12% 15%` · `--muted-foreground 150 10% 60%` · `--secondary 150 12% 15%` · `--accent 25 85% 45%` · `--accent-foreground 0 0% 100%` · `--success 160 84% 45%` · `--warning 38 92% 55%` · `--destructive 0 72% 51%`.
Sidebar: `--sidebar-background 150 20% 5%`, `--sidebar-foreground 150 10% 92%`, `--sidebar-primary 25 85% 45%`, `--sidebar-accent 150 14% 11%`, `--sidebar-border 150 12% 15%`.
Gradients: primary `linear-gradient(135deg, hsl(25 85% 45%), hsl(20 75% 30%))`; hero `linear-gradient(180deg, hsl(150 20% 5%), hsl(150 15% 8%))`; glow `radial-gradient(ellipse at center, hsl(25 85% 45% / .2), transparent 70%)`.
Radius `--radius: 0.5rem`; cards `rounded-xl`; no oval/pill shapes except the library search input (`rounded-full`).
Font: **Lufga** self-hosted from `/public/fonts` (weights 100–900 + italics, `font-display: swap`), fallback `system-ui`. Mono: JetBrains Mono. Type scale: page H1 `text-2xl sm:text-3xl font-bold`, sub-page H1 `text-xl font-bold`, subtitle `text-sm text-muted-foreground`, card title `text-sm font-semibold line-clamp-2 min-h-[2.5rem]`, card body `text-xs text-muted-foreground line-clamp-2`, badges `text-[10px]`.
Layout: every page wrapped in a `PageContainer` — `w-full max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-8 sm:pb-10 min-w-0 overflow-x-hidden min-h-screen`, sections `space-y-6`.
Grids: item grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6`; bundles `1/2/3 gap-6`; deals `1/2/3/4/5 gap-4`; book covers `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5` with `aspect-[3/4]` tiles; mockups `1/2/3 gap-5` with `aspect-[4/3]`.
Card: `rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5`, thumbnail `aspect-video bg-muted object-contain` (first 8 eager, rest lazy), body `p-4 space-y-2`, action row `flex items-center gap-1.5 pt-2 mt-auto`. Loading = 6 `animate-pulse` skeletons of the same geometry. Icons: lucide-react only. Toasts: sonner. Mobile-first for 360–414px with 44px touch targets.

## Navigation (persistent sidebar, 3 groups)

- MASTER LIBRARY: Home `/`, Bundles `/bundles`, Product Requests `/requests`, Saved `/saved`
- RESOURCES: Digital Product University `/university`, Evergreen Problems `/evergreen` (badge NEW), Product Mockups `/mockups`, Book Covers `/book-covers`, Special Deals `/deals`
- TOOLS: PDF Rebrander `/tools/pdf-rebrander`, Product Descriptions `/tools/product-descriptions`, Product Ideas `/tools/product-ideas`, Book Title Generator `/tools/book-title-generator`
- Child routes (not in sidebar): `/item/:id`, `/bundle/:id`, `/evergreen/:slug`, `/university/:slug`, `/university/:slug/course/:courseSlug`, `/university/:slug/course/:courseSlug/lesson/:index`
- Admin (new): `/admin/items`, `/admin/requests` — admin role only.

## Database (Lovable Cloud, RLS + GRANTs on every table)

- `visionaire_items`: id uuid pk, type text not null, title text not null, description text, category text not null, tags text[] default '{}', thumbnail_url text, download_url text, external_url text, drive_file_id text, content jsonb default '{}', format text, file_size text, page_count int, word_count int, source_url text, preview_image_url text, slug text, sort_order int default 0, featured boolean default false, is_active boolean default true, created_at, updated_at (+ trigger). Indexes on category, type, is_active, GIN on tags, unique partial on slug. RLS: public SELECT where `is_active`; admin-only insert/update/delete via `has_role(auth.uid(),'admin')`.
- `visionaire_user_saves`: (user_id, item_id) pk, item_id FK → items cascade, created_at. Authenticated users read/insert/delete their own rows only.
- `visionaire_product_requests`: id, user_id, title, description, status text default 'open', votes_count int default 0, sort_order int, is_active boolean default true, created_at, updated_at. Public read of active rows; authenticated insert; admin update/delete.
- `visionaire_request_votes`: id, request_id, user_id, created_at, unique (request_id, user_id). Authenticated own-row read/insert/delete; trigger maintains `votes_count`.
- `visionaire_tool_runs`: id, user_id, tool_key text, input jsonb, output text, created_at. Authenticated own-row read/insert.
- `profiles` (id → auth.users, display_name, avatar_url) and `user_roles` + enum `app_role` + `has_role()` security-definer function. Roles never on profiles.
- Buckets: `visionaire-assets` (public, thumbnail mirrors) and `visionaire-uploads` (private, owner-scoped policies on `{auth.uid()}/…`).

## Auth

Email/password + Google sign-in. Public: library browse, item detail, bundles, deals, book covers, mockups, evergreen, university. Requires session: Saved, request submit/vote, tools, uploads. Requires admin role: `/admin/*`. No onboarding flow, no allowlist.

## Features

1. **Master Library** — fetch active items, client-side search over title/description/tags, category filter + quick chips, format filter, sort (Newest/Oldest/A–Z/Z–A), "Recently viewed" of the last 8 ids in `localStorage` key `visionaire_recent_v1`, skeleton loading, empty state.
2. **Item card actions** — Open (navigate to detail), Download (only when `download_url` exists; route through the Drive proxy edge function, blob download, fall back to opening the URL), Save/Unsave bookmark with accent-colored `BookmarkCheck` when saved. Thumbnail fallback chain: `thumbnail_url` → Drive thumbnail from `drive_file_id` → type icon (Play for video, Headphones for audio/podcast, FileText otherwise).
3. **Item detail** — cover, type badge, description, tags, download + save, external link, related items from the same category.
4. **Bundles** — search over bundle titles; when a bundle has no art, render a deterministic gradient hashed from its title (`hsl(h1,55%,25%) → hsl(h2,45%,15%)`, 135deg). Bundle detail lists the bundle's Drive folder children with per-file download.
5. **Special Deals** — items in category `special_deals`.
6. **Product Requests** — submit a request (auth), one upvote per user with live counts, status badges, plus a "Recently completed" strip.
7. **Saved** — the signed-in user's saved items in the same grid.
8. **Book Cover Templates** — paginated gallery of 120 cover templates, filter + open/download per tile.
9. **Product Mockups** — resource cards (gradient packs, Shots.so) plus a Box Mockup gallery with an editor that composites a user logo/artwork onto a mockup image on canvas and exports a PNG.
10. **Evergreen Problems** — list + slug-routed detail, seeded from a bundled JSON dataset of 27 records.
11. **Digital Product University** — 7 tracks → course detail → lesson viewer with prev/next; lesson bodies are bundled TSX content modules keyed by course id. Persist lesson completion per user in the database (improvement over the original, which kept it in memory only).
12. **AI tools** — one auth-gated edge function taking `{ toolKey, prompt }`, calling `google/gemini-3-flash-preview` via the Lovable AI Gateway with per-tool system prompts, handling 429/402 explicitly, and returning `{ text }`. Prompts: *product_descriptions* — world-class digital product copywriter, output headline, subheadline, 3–5 benefit bullets and a CTA; *product_ideas* — digital product strategist, output product name, format, target audience, price range and a one-line pitch; *book_title_generator* — bestselling title creator, output main title + subtitle options. Each tool page saves runs to `visionaire_tool_runs` and shows the last 20.
13. **PDF Rebrander** — upload a PDF to the private bucket, then generate a branded cover (title, subtitle, logo) on canvas and download it as PNG. Label it accurately as a cover generator.
14. **Admin** — CRUD on items (including bulk activate/deactivate, category/type/tag editing) and request status management.

## Google Drive

Large files stay in Google Drive under a link-shared library folder. Build three edge functions using a Drive API key secret:
- `drive-ingest-library` — walk the folder tree, map top-level folder names to category/type (Ebooks→ebooks/ebook, Bundles→bundles/bundle, Audio→audio/audio, Video Learning→video_learning/video, Checklists→checklists/checklist, Guides→guide/guide, Workbooks→workbook/workbook, Templates→templates/template, Mockups→mockups/mockup, Tools→toolstack/tool, Courses→courses/course, Podcast→business_podcast/podcast, Special Deals→special_deals/deal, Master Library→master_library/ebook, Evergreen→evergreen/ebook), upsert items storing `drive_file_id`, and **mirror each thumbnail into the `visionaire-assets` bucket** so no thumbnail depends on an external host.
- `drive-download-proxy` — accept `{ file_id }`, stream `alt=media` bytes back so downloads never hit a Drive interstitial.
- `drive-fix-covers` — backfill missing thumbnails.
Never expose the Drive API key to the browser; never link raw Drive URLs from the UI.

## Non-negotiables

Semantic design tokens only. No dead controls or "Coming Soon" placeholders. RLS + GRANTs on every table. Every list has loading, empty and error states. Zero horizontal scroll at 360px. Set a real page title, meta description, canonical and one H1 per route.
