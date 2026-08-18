# Visionaire — Yangu Dependency Map

## Hard couplings that must be rewritten or dropped

| Dependency | Where | Action in the independent project |
| --- | --- | --- |
| `useUnlockGate` (ads/credits unlock) — `src/hooks/useUnlockGate.tsx`, `src/lib/ads/unlockMatrix.ts` (`download_ebook`, `download_mockup`, `export_pdf`, `download_asset`) | `VisionaireItemCard.tsx`, `VisionaireItemDetail.tsx`, `PDFRebrander.tsx` | **Drop.** Downloads become direct. Re-add monetisation later only if wanted. Removing it also removes the ads provider, credits ledger and quota RPC chain. |
| Dashboard shell, top bar, sidebar (`src/config/dashboardNav.ts`, dashboard layout) | route wrappers | Replace with a small Visionaire-only shell + sidebar (3 groups, 13 links). |
| `AllowlistGate` + `dashboard_allowlist` + `is_dashboard_allowed()` | `/dashboard` wrapper | Drop, or replace with a Visionaire-owned invite table. |
| `ProtectedRoute` + onboarding gate | `/dashboard` wrapper | Replace with a plain session guard; no onboarding flow needed. |
| `useAuth` (`src/hooks/useAuth.tsx`) | saves, votes, requests, tool runs, uploads | Copy — it is generic Supabase session logic. |
| `src/integrations/supabase/client.ts` | everywhere | Auto-generated per project; do not copy, let Lovable generate it. |
| `drive_tokens` + `is_drive_connected()` + `drive-connect/callback/upload` | `src/lib/integrations/googleDrive.ts` | Copy only if per-user Drive upload is kept. Not needed for the library. |
| Route prefix `/dashboard/visionaire/*` | `src/App.tsx` | Flatten to `/`, `/bundles`, `/requests`, `/saved`, `/university`, … |
| Yangu brand (`YanguLogo`, Yangu meta/SEO, `yangu.io` links) | shell, auth pages, `index.html` | Replace with Visionaire branding. |
| Cross-links pointing at Visionaire from 11 Yangu files (navigation dashboard, help center, blog, updates, app-store icon map, courses panel, my-business page, manage pages, landing tests) | see `01-architecture-and-routes.md` | In Yangu these become external links to the new domain when Visionaire is finally removed. |

## Soft couplings — copy as-is, no edits

`src/lib/utils.ts` (`cn`), the shadcn `src/components/ui/*` set used by Visionaire (button, input, badge, select, dialog, textarea, label, skeleton, tooltip), `sonner` toasts, `@tanstack/react-query` provider, `react-router-dom`, `src/lib/typography.ts`, `src/index.css` token block, `tailwind.config.ts`, `public/fonts/Lufga-*`, `src/lib/driveUtils.ts`, `src/hooks/useVisionaireItems.ts`.

## Things Visionaire does **not** depend on (confirmed by search)

Surfaces/builder, commerce/cart/orders, social media module, AI Agents, agency, offline/foot-soldier, developers portal, explore/discovery engine, `learning_*` tables, MCP server, ads placements beyond the unlock gate.
