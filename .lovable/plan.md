# Visionaire Ebook / Google Drive Asset Audit — Report Only

Nothing was changed. All facts below were read from the live Yangu code and database.

## 1. Asset source per type

| Asset type | Source of truth | How it is stored |
| --- | --- | --- |
| Ebook / guide / workbook / checklist PDFs | Google Drive (public shared folder) | Full Drive download URL in `visionaire_items.download_url` |
| Book covers (Drive-ingested) | Google Drive | `thumbnail_url` = Drive thumbnail URL (42 rows) or `lh3.googleusercontent.com/d/{id}` (195 rows) |
| Book Cover Templates gallery | Third-party host `entrepedia-products.com` | 121 `thumbnail_url` rows |
| Audio / podcast | Google Drive | `download_url` (only 19 of 58 audio rows have one) |
| Video learning | Google Drive folder | `source_url` folder link; only 14 of 65 have `download_url` |
| Bundles | Google Drive folder | `source_url` folder, listed live at view time |
| Courses / University lessons | Static TSX/JSON in repo (`src/data/university/...`) — not the DB, not Drive | in-repo |
| Mockups, product/brand tiles, promo art | Local repo assets (`src/assets/mockups`, `src/assets/products`, `src/assets/university`) ≈23 MB | bundled files |
| PDF Rebrander uploads | Supabase Storage `visionaire-uploads` (private) | `{user_id}/{ts}-{filename}` |
| `visionaire-assets` bucket | exists, **0 objects** | unused |

Master Drive folder: `https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362`, with one folder per category (EBOOKS, BUNDLES, AUDIO, VIDEO LEARNING, CHECKLISTS, GUIDE, WORKBOOK, TEMPLATES, TOOLSTACK, COURSES, BUSINESS PODCAST, PROMPTS; `VLS` excluded), then one sub-folder per product containing the PDF plus a cover image.

Sharing model: files are **"Anyone with the link" (public read)**. Access is via the **Drive v3 REST API with a plain API key** — no service account, no OAuth, for the whole library read/download path. Secret name used: `GOOGLE_PLACES_API_KEY` (a Google API key with Drive API enabled; the name is historical). A second, unrelated per-user OAuth path exists for uploads only (`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`) and is **not** used by the library.

The app stores **full URLs, never bare file IDs**; file IDs are re-extracted from those URLs at click time.

## 2. Database

`public.visionaire_items` is the only table that drives library content.

- `id`, `type`, `title`, `description`, `category`, `tags text[]`, `slug`, `sort_order`, `is_active`, `created_at`
- `download_url` — ebook/PDF/audio file link (Drive)
- `thumbnail_url` — cover image
- `source_url` — Drive folder (or file) link; used for bundle listing and cover backfill
- `external_url`, `preview_image_url`, `content jsonb`, `file_size`, `page_count`, `word_count`, `format` — mostly unused (`external_url` 0 rows, `preview_image_url` 0 rows)
- No Drive-ID column exists — IDs live inside the URLs.

Grouping is flat: `category` (text) + `type` (text) + `tags`. No authors, no collections, no join tables.

Supporting tables: `visionaire_user_saves` (2 rows), `visionaire_product_requests` (63), `visionaire_request_votes` (3), `visionaire_tool_runs` (0), `drive_tokens` (platform-wide OAuth, upload path only).

RLS: `visionaire_items` has one policy — `SELECT USING (is_active = true)` for role `public`, so anonymous and authenticated users both read the catalog. There is **no INSERT/UPDATE/DELETE policy**: writes happen only through service-role edge functions. Saves/votes/requests/tool-runs are `authenticated`, owner-scoped.

## 3. Exact URL formats

Stored formats (verified counts of 660 rows):

```text
download_url  https://drive.google.com/uc?export=download&id=13xtVcjOnZS69vekYN8Mj8ghMnYmYuoED   (435 rows, 100% of non-null)
source_url    https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362           (558 folder, 102 null)
thumbnail_url https://drive.google.com/thumbnail?id=1_4aolgMx15Hf3E9q3fqKa1SmQKQdQcOM&sz=w800    (42)
              https://lh3.googleusercontent.com/d/1_3V823Dzwg2HsfzqM7amaBxJWE-hiTWs              (195)
              https://entrepedia-products.com/app/book-cover-templates/Cover-1.jpeg              (121)
              /images/covers/chatbots-small-business.jpg                                          (5)
              null                                                                                (297)
```

Transformations:

```text
Cover:     stored URL → used as-is in <img src>  (no transform; onError falls back to an icon)
Fallback:  no thumbnail_url → extractDriveFileId(download_url)
                            → https://drive.google.com/thumbnail?id={id}&sz=w400

Download:  https://drive.google.com/uc?export=download&id=FILE_ID
             → extractDriveFileId() regex /[?&]id=([a-zA-Z0-9_-]+)/  → FILE_ID
             → POST edge function drive-download-proxy { file_id }
             → server: GET https://www.googleapis.com/drive/v3/files/{id}?fields=name,mimeType,size&key=KEY
             → server: GET https://www.googleapis.com/drive/v3/files/{id}?alt=media&key=KEY
             → streamed back with Content-Disposition: attachment
             → browser Blob → object URL → <a download>
           If no file id is parsed, or the proxy fails, the raw stored Drive URL is opened in a new tab.

Bundle:    source_url → /folders\/([a-zA-Z0-9_-]+)/ → folder_id
             → POST drive-download-proxy { list_folder: true, folder_id }
             → { files: [{id,name,mimeType}] } rendered as the bundle's child list
```

## 4. Frontend loading trace (one ebook)

```text
visionaire_items row (is_active = true)
  → useVisionaireItems(category)            src/hooks/useVisionaireItems.ts
      supabase.from("visionaire_items").select("*").eq("is_active", true)
        .eq/in("category", …).order("created_at", desc)
  → VisionaireHome.tsx  (route /dashboard/visionaire)   client-side search/filter over the fetched set
  → VisionaireGrid.tsx → VisionaireItemCard.tsx
      cover: getItemThumbnail(item)          src/lib/driveUtils.ts
  → "Open" → VisionaireItemDetail.tsx  (route /dashboard/visionaire/item/:id)
  → "Download" → useUnlockGate(actionKey)    src/hooks/useUnlockGate.tsx (ads/credits gate)
      actionKey: download_ebook | download_mockup | export_pdf | download_asset
  → handleDriveDownload(item.download_url)
      extractDriveFileId → supabase.functions.invoke("drive-download-proxy", { file_id })
  → edge function streams Drive bytes → Blob → file saved
```

Bundles: `VisionaireBundles.tsx` → `VisionaireBundleDetail.tsx` (folder listing through the same proxy). Saves: `useVisionaireSaves` / `useSaveItem` / `useUnsaveItem`. AI tools: `visionaire-llm` edge function.

## 5. Google Drive integration — YES, but API-key only

- Method: direct REST calls to `https://www.googleapis.com/drive/v3/files` with `key={GOOGLE_PLACES_API_KEY}`, `supportsAllDrives=true`, `includeItemsFromAllDrives=true`, paginated at `pageSize=1000`.
- Files: `supabase/functions/drive-ingest-library`, `drive-download-proxy`, `drive-fix-ebook-covers`, `drive-debug-folders`; client helper `src/lib/driveUtils.ts`.
- No service account, no OAuth, no Drive SDK for the library. It works **only because the folder is link-shared publicly**.
- Separate, optional per-user OAuth exists for *uploads*: `drive-connect` → `drive-callback` → `drive_tokens` → `drive-upload`, scope `drive.file`, redirect `{SUPABASE_URL}/functions/v1/drive-callback`, client helper `src/lib/integrations/googleDrive.ts` + `is_drive_connected()` RPC. Visionaire's library does not use it.

## 6. Edge functions

| Function | Purpose | Input | Output | Secrets | Needed in new project |
| --- | --- | --- | --- | --- | --- |
| `drive-download-proxy` | Streams a Drive file as an attachment; also lists a folder | `{file_id}` or `{list_folder:true, folder_id}` | file bytes, or `{files:[…]}` | `GOOGLE_PLACES_API_KEY` | **Yes — critical** |
| `drive-ingest-library` | Walks the Drive tree, maps folder→category/type, inserts rows | `{folder_id}` | per-category insert/skip counts | Google key + `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (repopulate / keep in sync) |
| `drive-fix-ebook-covers` | Backfills missing `thumbnail_url` from folder images | admin call | updated count | same | Yes (useful; 297 rows lack covers) |
| `drive-debug-folders` | Inspects folder contents for given item ids | `{item_ids:[…]}` | file/subfolder listing | same | Optional |
| `visionaire-llm` | AI tools (ideas, titles, descriptions) | prompt payload | text | Lovable AI Gateway key | Yes if tools are kept |
| `drive-connect` / `drive-callback` / `drive-upload` | Per-user Drive OAuth uploads | — | — | `GOOGLE_DRIVE_CLIENT_ID/SECRET` | Only if uploads are kept |

Auth: the proxy is public (no auth check in code); ingest/fix/debug require admin role or service role. `verify_jwt` is not set for the Drive read functions, so they run with the Lovable default (no gateway JWT enforcement).

## 7. Existing content

660 rows in `visionaire_items` (595 active), largest groups: ebooks 181, bundles 68, video_learning 65, guide 60, master_library 60, audio 58, checklists 41, `vls` 23 (excluded — different app). Metadata lives entirely in that table; there are zero objects in either storage bucket.

Reusable as-is: **435 rows have a working `uc?export=download&id=` Drive link** and 558 have a folder `source_url`. Those migrate verbatim and keep working as long as the same Drive folder stays link-shared and the new project holds a Drive-enabled API key. Weak spots to expect: 297 rows with no cover, 195 `lh3.googleusercontent.com` covers (derived, can rot), 121 covers on `entrepedia-products.com` (third-party), and 225 rows with no download link.

## 8. Migration checklist for the independent Visionaire project

**A. Database** — create `visionaire_items` with the same columns (incl. `download_url`, `thumbnail_url`, `source_url`, `category`, `type`, `tags`, `is_active`, `slug`, `sort_order`); import the 660 rows (drop the 23 `vls` rows); create `visionaire_user_saves`, `visionaire_product_requests`, `visionaire_request_votes`, `visionaire_tool_runs`; add `GRANT`s.

**B. Google Drive** — keep the same folder `1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362`, keep it "Anyone with the link → Viewer", keep the category/product folder shape; enable the Drive API on the Google Cloud project behind the API key and leave the key unrestricted by HTTP referrer (it is used server-side).

**C. Storage** — create `visionaire-uploads` (private, owner-scoped policies) for the PDF Rebrander and `visionaire-assets` (public) if you later mirror covers. Nothing to copy — both are empty today.

**D. Edge functions** — copy `drive-download-proxy`, `drive-ingest-library`, `drive-fix-ebook-covers` (and `drive-debug-folders`, `visionaire-llm` as needed) unchanged.

**E. Secrets** — `GOOGLE_PLACES_API_KEY` (Drive API key; may be renamed if the function code is renamed with it); `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_URL` + `SUPABASE_ANON_KEY` (auto-provided); `LOVABLE_API_KEY` for the AI tools; `GOOGLE_DRIVE_CLIENT_ID/SECRET` only if per-user uploads are kept.

**F. Frontend code** — copy `src/lib/driveUtils.ts`, `src/hooks/useVisionaireItems.ts`, `src/components/visionaire/*`, `src/pages/dashboard/visionaire/*`, and the in-repo assets (`src/assets/university`, `src/assets/mockups`, `src/assets/products`, `public/fonts/Lufga-*`). Replace the `useUnlockGate` dependency with a direct download (or a Visionaire-owned gate) and drop `AllowlistGate`.

**G. Permissions / RLS** — `visionaire_items`: public `SELECT` where `is_active`, no client writes, service-role/admin writes only. Owner-scoped policies on saves, votes, tool runs; public read + authenticated insert on product requests.

No new architecture is required; the existing implementation transfers directly. The one optional improvement (not required for parity) is mirroring covers into Storage to remove the `lh3` / `entrepedia` rot risk.

## EXACT CONFIGURATION TO REPRODUCE IN THE NEW VISIONAIRE PROJECT

1. Confirm the Drive folder `1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362` is shared "Anyone with the link → Viewer".
2. Add secret `GOOGLE_PLACES_API_KEY` = a Google API key with the **Drive API** enabled, no referrer restriction.
3. Create table `visionaire_items` with the same columns; RLS: `SELECT USING (is_active = true)` to `public`; no client write policies; GRANT `select` to `anon`/`authenticated`, `all` to `service_role`. Create the 4 supporting tables with owner-scoped policies.
4. Import the exported `visionaire_items` rows verbatim (URLs unchanged, `vls` excluded).
5. Deploy `drive-download-proxy`, `drive-ingest-library`, `drive-fix-ebook-covers` unchanged.
6. Copy `src/lib/driveUtils.ts`, `useVisionaireItems.ts`, `components/visionaire/*`, `pages/.../visionaire/*`; remove the unlock-gate and allowlist coupling.
7. Create buckets `visionaire-uploads` (private, owner policies) and `visionaire-assets` (public).
8. Verify in this order: catalog list renders → a cover loads → click Download on an ebook → the proxy returns the PDF → open a bundle and confirm its Drive folder children list.
9. Optionally re-run `drive-ingest-library` with `folder_id = 1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362`, then `drive-fix-ebook-covers`, to refresh links and backfill the 297 missing covers.
