# Visionaire — Database & Authentication (G, H)

Row counts and DDL captured 2026-08-18 by read-only query.

## G. Table inventory

### 1. `public.visionaire_items` — **COPY**
The catalog. 660 rows, 595 active.

Columns: `id uuid pk default gen_random_uuid()`, `type text not null`, `title text not null`, `description text`, `category text not null`, `tags text[] default '{}'`, `thumbnail_url text`, `download_url text`, `external_url text`, `content jsonb not null default '{}'`, `is_active boolean not null default true`, `created_at timestamptz not null default now()`, `slug text`, `file_size text`, `page_count int`, `word_count int`, `format text`, `source_url text`, `preview_image_url text`, `sort_order int default 0`.

Indexes: PK on `id`; `idx_visionaire_items_slug` unique partial on `slug` where not null.
Referenced by: `visionaire_user_saves.item_id` (ON DELETE CASCADE).
RLS: `Anyone can read active visionaire items` — `FOR SELECT USING (is_active = true)`, role `public`. **No INSERT/UPDATE/DELETE policy exists** — the catalog is writable only by service-role code (`drive-ingest-library`, `drive-fix-ebook-covers`) and SQL migrations.

Category/type distribution (660 rows):

| category | type | rows |
| --- | --- | --- |
| ebooks | ebook | 181 |
| bundles | bundle | 68 |
| video_learning | video | 65 |
| guide | guide | 60 |
| master_library | ebook | 60 |
| audio | audio | 58 |
| checklists | checklist | 41 |
| vls | vls | 23 |
| toolstack | tool | 17 |
| workbook | workbook | 16 |
| courses | course | 14 |
| templates | template | 13 |
| mockups | mockup | 12 |
| special_deals | deal | 8 |
| evergreen | ebook / template | 6 / 2 |
| university | course | 6 |
| tools | tool | 4 |
| business_podcast | podcast | 2 |
| master_library | course / template | 2 / 2 |

Note: `vls` (23 rows) belongs to a separate app and is excluded from the ingest map — filter it out in the new project.

### 2. `public.visionaire_user_saves` — **RECREATE** (structure), data optional
Columns: `user_id uuid`, `item_id uuid`, `created_at timestamptz`. PK `(user_id, item_id)`. FK → `visionaire_items(id)` cascade. 2 rows.
RLS (all `authenticated`): read own (`Users can read own saves`), insert own, delete own.

### 3. `public.visionaire_product_requests` — **COPY** (structure + rows, user_id remapped)
Columns: `id uuid pk`, `user_id uuid`, `title text`, `description text`, `status text`, `votes_count int`, `sort_order int`, `is_active boolean`, `created_at`, `updated_at`. 63 rows.
RLS: `Anyone can view active requests` (SELECT, public); `Auth users can create requests` (INSERT, authenticated). No UPDATE/DELETE policy — status changes are service-role only.

### 4. `public.visionaire_request_votes` — **RECREATE**
Columns: `id uuid pk`, `request_id uuid`, `user_id uuid`, `created_at`. Unique `(request_id, user_id)`. 3 rows.
RLS (authenticated): insert, select, delete own votes.

### 5. `public.visionaire_tool_runs` — **RECREATE**
Columns: `id uuid pk`, `user_id uuid`, `tool_key text`, `input jsonb`, `output text`, `created_at`. 0 rows.
RLS (authenticated): insert own, read own.

### 6. `public.drive_tokens` — **SHARED**
Columns: `user_id uuid`, `access_token text`, `refresh_token text`, `expires_at`, `created_at`, `updated_at`. Used by `drive-connect`/`drive-callback`/`drive-upload` across the whole platform, not just Visionaire. Recreate in the new project **only if** you keep per-user Drive OAuth (uploads). Read-only library downloads need just an API key, not tokens.

### 7. `learning_*` tables (13 tables) — **DO NOT MOVE**
Verified: no Visionaire page or hook references any `learning_*` table. Digital Product University is entirely static TSX. These belong to the separate Yangu learning module.

### Storage buckets

| Bucket | Public | Objects | Verdict |
| --- | --- | --- | --- |
| `visionaire-assets` | yes | 0 | RECREATE (currently unused) |
| `visionaire-uploads` | no | 0 | RECREATE — target of PDF Rebrander uploads (`{user_id}/{ts}-{filename}`) |

No RLS policy on `storage.objects` was found scoped to these buckets, so uploads currently rely on default bucket behaviour. The new project must add explicit owner-scoped policies for `visionaire-uploads`.

### Gaps to fix in the new project (do not change here)

- Add `updated_at` + trigger on `visionaire_items`.
- Add indexes on `category`, `type`, `is_active`, and a GIN index on `tags` (search is currently client-side over the whole fetched set).
- Add `featured boolean`, `drive_file_id text`, `bundle_id uuid`, `course_id uuid` for the Drive-catalog architecture in `04-assets-and-drive.md`.
- Add admin-only write policies (`has_role(auth.uid(),'admin')`) so a real admin UI can manage the catalog.
- Add `GRANT` statements for `authenticated`/`anon`/`service_role` on every new table.

## H. Authentication architecture

Current state:

- Provider: Lovable Cloud (Supabase) auth via `src/hooks/useAuth.tsx` and `src/integrations/supabase/client.ts` (localStorage session, autorefresh).
- Signup / login / reset / verify: `src/pages/auth/Signup.tsx`, `Login.tsx`, `ResetPassword.tsx`, `UpdatePassword.tsx`, `VerifyEmail.tsx`, `AuthCallback.tsx` — all Yangu-wide, shared with every module.
- Gatekeeping to reach Visionaire: `ProtectedRoute` (session required) → onboarding completion → `AllowlistGate` (`dashboard_allowlist` table + `is_dashboard_allowed(uid)` RPC). **An allowlisted Yangu account is required today.**
- Profiles/roles: `public.profiles`, `public.user_roles` + `has_role()`. Visionaire itself reads no role and enforces no permission — it only needs `auth.uid()` for saves, votes, requests, tool runs and PDF uploads.
- Session-dependent features: Saved, Product Requests (create/vote), tool-run history, PDF upload. Anonymous users can still read the catalog (public SELECT).
- No course-progress or download records are persisted for users.

What independent Visionaire needs:

1. Its own Supabase project with email/password + Google sign-in (Lovable Cloud defaults).
2. Its own `profiles` table (`id` → `auth.users`, display name, avatar) and `user_roles` + `has_role()` for admin.
3. Remove `AllowlistGate` and the `dashboard_allowlist` dependency, or replace it with a Visionaire-owned invite table if access should stay gated.
4. Simple `ProtectedRoute` for `/saved`, `/requests`, `/tools/*`, `/admin`; keep browse/detail public or gated as you choose.
5. User migration: do **not** try to move `auth.users`. Existing Visionaire user data is tiny (2 saves, 3 votes, 63 requests). Recommended: import `visionaire_product_requests` with `user_id = NULL` plus a preserved `legacy_user_id text` column for reference, and let the 2 saves be re-created by users. If you later need real account migration, export emails from Yangu and invite those users into the new project.
