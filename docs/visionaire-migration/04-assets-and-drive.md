# Visionaire — Assets & Google Drive Audit (I, J)

## I. Asset inventory

### In-repo assets (must be copied file-for-file)

| Location | Files | Size | Used by |
| --- | --- | --- | --- |
| `src/assets/university/` | 9 images + `courses/` | 5.6 MB | University hub + course headers (`ai-writing.jpg`, `creation-trap-cycle.png`, `editable-plr-products.jpg`, `funnel.jpg`, `master-library-guide.webp`, `online-business.jpg`, `platforms-guide.jpg`, `pricing-guide.jpg`, `visuals-guide.jpg`) |
| `src/assets/university/courses/` | 7 icons | — | course cards (`brush.png`, `building.png`, `coin.png`, `copywriting.png`, `funnel.png`, …) |
| `src/assets/mockups/` | 3 images | 7.9 MB | Product Mockups resource cards (`box-mockups.png`, `gradients.png`, `shots-so.jpg`) |
| `src/assets/mockups/boxes/` | 21 images | — | Box Mockup gallery + AI editor |
| `src/assets/products/` | 8 images | 9.2 MB | product/brand tiles (incl. `visionaire.jpg`) |
| `src/assets/custom-ebook-promo.jpg` | 1 | — | promo card |
| `public/fonts/Lufga-*.otf` | 18 files | — | typography (required) |

Total in-repo Visionaire media ≈ **23 MB**. Copy verbatim; do not regenerate.

### External / not owned by this project

| Host | Count | Used for | Risk |
| --- | --- | --- | --- |
| `drive.google.com` | 435 `download_url`, 42 `thumbnail_url` | ebooks, bundles, audio, video files | Depends on link-sharing staying on |
| `lh3.googleusercontent.com` | 195 thumbnails | Drive-derived covers | Signed/derived URLs; can rot |
| `entrepedia-products.com` | 121 thumbnails + 120 Book Cover tiles + Completed Products strip | covers | **Third-party host, highest content-loss risk** |
| Storage buckets | 0 objects | — | Nothing to migrate |

**No book, PDF, mockup file or course video is stored inside this project.** The migration therefore carries metadata and pointers, not the payloads.

## J. Google Drive integration audit

Library folder: `https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362`.

### Two independent Drive paths exist

**1. Catalog / read path (API-key, no user OAuth) — this is what the library uses.**
- `drive-ingest-library` — walks the shared folder tree with `GOOGLE_PLACES_API_KEY` against `https://www.googleapis.com/drive/v3/files`, maps top-level folder names → `category`/`type`, and upserts into `visionaire_items` with `download_url = https://drive.google.com/uc?export=download&id={id}` and `thumbnail_url` from Drive's `thumbnailLink`. Folder→category map covers Ebooks, Bundles, Audio, Video Learning, Checklists, Guides, Workbooks, Templates, Mockups, Tools, Courses, Podcast, Special Deals, Master Library, Evergreen (excludes `vls`).
- `drive-download-proxy` — takes `{ file_id }`, fetches `alt=media` with the API key, and streams bytes back so the browser downloads without a Drive interstitial.
- `drive-fix-ebook-covers` — backfills missing `thumbnail_url`.
- `drive-debug-folders` — inspection helper.
- Client helpers: `src/lib/driveUtils.ts` (`extractDriveFileId`, `getDriveThumbnailUrl(fileId, size=400)` → `https://drive.google.com/thumbnail?id=…&sz=w400`, `getItemThumbnail`).
- Bundle detail lists a bundle's Drive folder children at view time.

**2. Per-user OAuth path (uploads) — platform-wide, only lightly used by Visionaire.**
- `drive-connect` → `drive-callback` → tokens in `drive_tokens`; `drive-upload` pushes a file server-side. `src/lib/integrations/googleDrive.ts` + `is_drive_connected()` RPC. Client never sees tokens.

### Verdict

- Files are **link-shared, public-read** — that is why an API key alone works. This makes the migration easy but also means anyone with a file id can download.
- Reliability: acceptable for reads through the proxy; fragile for thumbnails (`lh3.googleusercontent.com` URLs are derived and expire), and fully dependent on the folder staying shared.
- **Recommended for the independent project:** keep Drive as the source of truth for large files (cheap, already organised), but
  1. store `drive_file_id` as a first-class column instead of parsing it out of a URL,
  2. always serve downloads through the proxy function (never a raw Drive link),
  3. **mirror thumbnails into Supabase Storage** on ingest — this removes the `lh3`/`entrepedia` rot risk and is the single highest-value improvement,
  4. re-run an ingest function in the new project rather than trusting copied URLs forever.
- Secrets required in the new project: `GOOGLE_PLACES_API_KEY` (Drive API key) for ingest/proxy; `GOOGLE_DRIVE_CLIENT_ID` + `GOOGLE_DRIVE_CLIENT_SECRET` only if per-user uploads are kept.
