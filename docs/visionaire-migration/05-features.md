# Visionaire — Information Architecture & Library Functionality (K, L)

## K. Information architecture

```text
Visionaire
├── MASTER LIBRARY
│   ├── Home            all active items, search + category + format + sort
│   ├── Bundles         category = bundles → Bundle Detail (Drive folder listing)
│   ├── Product Requests  community requests + upvotes + Completed Products strip
│   └── Saved           user's saved items
├── RESOURCES
│   ├── Digital Product University  static tracks → course → lesson viewer
│   ├── Evergreen Problems          27 static records → detail
│   ├── Product Mockups             Gradients, Shots.so, Box Mockups (AI editor)
│   ├── Book Covers                 120 external cover templates
│   └── Special Deals               category = special_deals
└── TOOLS
    ├── PDF Rebrander        client-side canvas cover generator
    ├── Product Descriptions AI (visionaire-llm)
    ├── Product Ideas        AI
    └── Book Title Generator AI
```

Every content item is a row in `visionaire_items` keyed by `category` + `type`. Items are not organised in a hierarchy — bundles are items whose Drive folder holds children, resolved at view time.

## L. Library functionality

### Discovery (`VisionaireHome.tsx`)
- Fetch: `useVisionaireItems()` → all rows where `is_active = true`, ordered `created_at desc`. No pagination, no server-side filtering — the entire active set (595 rows) is loaded and filtered in the browser.
- Search: case-insensitive substring over `title`, `description` and `tags`.
- Category filter: derived from the distinct `category` values present in the result set, rendered as a `Select` plus quick tag chips.
- Format filter: derived from distinct `type` values.
- Sort: Newest (`created_at desc`), Oldest, A–Z, Z–A.
- Recently viewed: last 8 item ids in `localStorage` (`visionaire_recent_v1`), rendered as a row above the grid.
- Empty state: centered "No items found." message. Loading state: 6 `animate-pulse` card skeletons.

### Card actions (`VisionaireItemCard.tsx`)
- **Open** — `navigate('/dashboard/visionaire/item/:id')`; also fires on card click.
- **Download** — only rendered when `download_url` exists. Passes through `useUnlockGate(actionKey)`, where actionKey is `download_ebook` (ebook/book), `download_mockup` (mockup/template), `export_pdf` (pdf) or `download_asset`. On unlock: extract the Drive id, invoke `drive-download-proxy`, build a blob and click a synthetic anchor; on any failure fall back to `window.open(download_url)`.
- **Save / Unsave** — bookmark toggle writing `visionaire_user_saves`, optimistic toast via sonner, `BookmarkCheck` in accent orange when saved.
- Thumbnail resolution order: `thumbnail_url` → Drive thumbnail derived from `download_url` → type icon placeholder (Play / Headphones / FileText).
- First 8 cards load eagerly, the rest lazily.

### Item detail (`VisionaireItemDetail.tsx`)
Large cover, title, type badge, description, tags, download + save actions, `external_url` link, and a related-items grid from the same category.

### Bundles (`VisionaireBundles.tsx` → `VisionaireBundleDetail.tsx`)
Search over bundle titles; card art falls back to a deterministic title-hashed gradient (`titleToGradient`). Detail lists the bundle's Drive folder children with per-file download.

### Product Requests (`ProductRequests.tsx`)
Submit a request (auth required), upvote/un-upvote once per user, live vote counts, status badges, plus the hardcoded Completed Products carousel.

### Tools
- The 3 AI tools POST `{ toolKey, prompt }` to `visionaire-llm` (auth-gated, `google/gemini-3-flash-preview`, per-tool system prompt), render markdown-ish output, and persist to `visionaire_tool_runs` for a history list.
- PDF Rebrander: pick a PDF → upload to `visionaire-uploads/{user_id}/{ts}-{name}` → enter title/subtitle + logo → canvas composite → download `branded-cover.png`. The PDF body is untouched — this is a cover generator, and the naming is misleading.

### Not implemented anywhere
Pagination/infinite scroll, server-side search, download history, course progress persistence, ratings/reviews, collections/folders, purchase or entitlement checks, admin CRUD.
