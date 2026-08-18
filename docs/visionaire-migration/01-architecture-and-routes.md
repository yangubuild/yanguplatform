# Visionaire — Architecture, Routes, Feature Inventory (C, D, E)

## C. Current architecture

```text
Yangu SPA (React 18 + Vite + TS + Tailwind + shadcn/ui)
  └── /dashboard  (ProtectedRoute + AllowlistGate + dashboard shell/sidebar)
        └── /dashboard/visionaire/*        18 lazy-loaded pages
              ├── src/components/visionaire/*        4 components + mockups/
              ├── src/hooks/useVisionaireItems.ts    all catalog/save/tool-run queries
              ├── src/lib/driveUtils.ts              Drive id + thumbnail helpers
              ├── src/data/university/*              static course content (TSX/JSON)
              ├── src/data/evergreen-problems.json   27 static problem records
              └── Lovable Cloud
                    ├── tables: visionaire_items, _user_saves, _product_requests,
                    │           _request_votes, _tool_runs  (+ drive_tokens, shared)
                    ├── buckets: visionaire-assets (public), visionaire-uploads (private) — both empty
                    └── edge functions: visionaire-llm, drive-download-proxy,
                          drive-ingest-library, drive-fix-ebook-covers,
                          drive-debug-folders, drive-connect, drive-callback, drive-upload
```

Rendering: every page wraps content in `VisionairePageContainer` (`max-w-[1200px]`, `px-3 sm:px-4 lg:px-6`, `pt-4 sm:pt-6`, `pb-8 sm:pb-10`, `min-h-screen`, `overflow-x-hidden`). Data access is React Query + the shared Supabase client. There is no Visionaire-specific layout component — the dashboard shell supplies sidebar and top bar.

## D. Complete route inventory

All routes are children of `/dashboard` in `src/App.tsx` (lines 92–109 lazy imports, 498–517 route defs).

| Path | Component | In sidebar | Notes |
| --- | --- | --- | --- |
| `/dashboard/visionaire` | `VisionaireHome` | Yes (Home) | Master Library browse |
| `/dashboard/visionaire/bundles` | `VisionaireBundles` | Yes | category = `bundles` |
| `/dashboard/visionaire/bundle/:id` | `VisionaireBundleDetail` | No (child) | lists Drive folder contents |
| `/dashboard/visionaire/requests` | `ProductRequests` | Yes | requests + voting + Completed Products |
| `/dashboard/visionaire/saved` | `SavedProducts` | Yes | |
| `/dashboard/visionaire/item/:id` | `VisionaireItemDetail` | No (child) | item detail + related |
| `/dashboard/visionaire/university` | `DigitalProductUniversity` | Yes | static hub |
| `/dashboard/visionaire/university/:slug` | `UniversityCourseDetail` | No | |
| `/dashboard/visionaire/university/:slug/course/:courseSlug` | `UniversityLessonViewer` | No | |
| `/dashboard/visionaire/university/:slug/course/:courseSlug/lesson/:courseLessonIndex` | `UniversityLessonViewer` | No | |
| `/dashboard/visionaire/university/:slug/lessons/:lessonIndex` | `UniversityLessonViewer` | No | legacy lesson path |
| `/dashboard/visionaire/evergreen` | `EvergreenProblems` | Yes (badge NEW) | 27 static records |
| `/dashboard/visionaire/evergreen/:slug` | `EvergreenProblemDetail` | No | |
| `/dashboard/visionaire/mockups` | `ProductMockups` | Yes | 3 resource cards + box mockup AI editor |
| `/dashboard/visionaire/book-covers` | `BookCoverTemplates` | Yes | 120 external covers, no DB |
| `/dashboard/visionaire/deals` | `SpecialDeals` | Yes | category = `special_deals` |
| `/dashboard/visionaire/tools/pdf-rebrander` | `PDFRebrander` | Yes | |
| `/dashboard/visionaire/tools/product-descriptions` | `ProductDescriptions` | Yes | |
| `/dashboard/visionaire/tools/product-ideas` | `ProductIdeas` | Yes | |
| `/dashboard/visionaire/tools/book-title-generator` | `BookTitleGenerator` | Yes | |

**There is no Visionaire admin route.** No page in the codebase writes to `visionaire_items`.

Sidebar source: `src/config/dashboardNav.ts` — parent entry `Visionaire` (line 89) with three groups: MASTER LIBRARY (Home, Bundles, Product Requests, Saved), RESOURCES (Digital Product University, Evergreen Problems, Product Mockups, Book Covers, Special Deals), TOOLS (PDF Rebrander, Product Descriptions, Product Ideas, Book Title Generator). The sidebar list you supplied is complete; the 6 child/detail routes above are the additions.

Visionaire is also *mentioned* (links/marketing/analytics only, no logic) in: `src/components/mass/navigation/NavigationDashboardPage.tsx`, `NavDashSidebar.tsx`, `src/pages/PlatformUpdates.tsx`, `src/pages/HelpCenter.tsx`, `src/components/mass/blog/blogData.ts`, `src/lib/app-store/icon-map.ts`, `src/components/dashboard/panels/CoursesPanel.tsx`, `src/pages/manage/ManageNavigation.tsx`, `src/pages/dashboard/MyBusinessPage.tsx`, `src/components/manage/ada/PerformancePanel.tsx`, `src/components/landing-test/LandingTestGettingStarted.tsx`.

## E. Feature inventory (working vs static vs placeholder)

| Feature | Status | Backing |
| --- | --- | --- |
| Master Library browse / search / filter / sort | Working | `visionaire_items` (595 active) |
| Save / unsave | Working | `visionaire_user_saves` |
| Item detail + related items | Working | `visionaire_items` by category |
| Drive download via proxy | Working | `drive-download-proxy` edge fn |
| Bundles list + bundle folder browse | Working | `bundles` category + Drive folder listing |
| Special Deals | Working | `special_deals` category (8 rows) |
| Product Requests + upvoting | Working | `visionaire_product_requests`, `visionaire_request_votes` |
| Completed Products strip | **Static** | hardcoded array in `CompletedProducts.tsx`, covers on `entrepedia-products.com` |
| Book Cover Templates | Working but **static list** | generated `Cover-1..120` URLs on `entrepedia-products.com`; no DB rows |
| Evergreen Problems | Working but **static** | `src/data/evergreen-problems.json` (27 records) |
| Digital Product University | Working but **static** | `masterclass-courses.ts` + `course-content/course-1..7` TSX; several courses flagged `comingSoon: true` and render a "Coming Soon" label |
| Course progress / completion | **Not implemented** | local component state only; no DB writes, no `learning_*` usage |
| Product Mockups — Gradients, Shots.so | Working | external links |
| Product Mockups — Box Mockups AI editor | Working | `BoxMockupGallery` + `BoxMockupEditor`, 21 local box images |
| Product Descriptions / Product Ideas / Book Title Generator | Working | `visionaire-llm` edge fn (Gemini via Lovable AI Gateway) + `visionaire_tool_runs` history |
| PDF Rebrander | **Partial / placeholder** | uploads the PDF to `visionaire-uploads`, but export only draws a canvas cover (title + logo) and downloads a PNG. It does **not** rebrand the PDF. |
| Payments / pricing / purchase | **Does not exist** | library is entitlement-free; downloads are gated by ads/credits only |
| Admin content management | **Does not exist** | catalog is populated by `drive-ingest-library` + SQL migrations |
