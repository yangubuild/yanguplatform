

## Updated Plan: Swappable Main Content Slot + Industry Palettes

Incorporates all 4 fixes from your feedback.

### 1. Atomic RPC: `builder_switch_main_content` (Fix #1)

**New database migration** — single-transaction RPC that:
- Takes `p_page_id`, `p_new_section_type`, `p_default_schema`
- Finds the current main content section (by `core_slot = 'main_content'` or fallback to type-in-set)
- Deletes it
- Inserts new section at **same position** with the new type and default schema
- Returns `{ ok: true, section_id: <new_id> }`

All in one transaction — no half-state possible.

### 2. `core_slot` column on `builder_sections` (Fix #2)

**Same migration** adds:
```sql
ALTER TABLE builder_sections ADD COLUMN core_slot text DEFAULT NULL;
```
Values: `'header'`, `'hero'`, `'main_content'`, `'offer'`, `'footer'`, or `NULL` (custom sections).

Update `builder_switch_main_content` to find main content via `WHERE core_slot = 'main_content'`.

Update auto-create logic in `useBuilderEditor.ts` to set `core_slot` when creating core stubs.

Update `enforceCoreSectionOrder` in `builderCoreSections.ts` to use `core_slot` for identification when present, falling back to type-in-set for backward compat.

### 3. Badge rename: "Core: Content" with Switch action (Fix #3)

**`BuilderSectionList.tsx`** changes:
- Main content section badge: `"Core: Content"` instead of `"Core"`
- Tooltip: `"Switch the main content layout for your business"`
- Action icon: `ArrowLeftRight` (from lucide) instead of no action
- Clicking opens a small popover listing available content types for this surface
- Other core sections keep `"Core"` badge as-is

### 4. Template hook stub: `applyTemplateForMainContent` (Fix #4)

**New file: `src/hooks/useMainContentTemplate.ts`**
```typescript
export function applyTemplateForMainContent(
  surfaceType: string,
  industry: string | undefined,
  mainContentType: string,
  variant?: string
): void {
  // STUB — will integrate with Justinmind templates later
  console.log("TEMPLATE_HOOK", { surfaceType, industry, mainContentType, variant });
}
```

Called inside `switchMainContent` in `useBuilderEditor.ts` immediately after the RPC succeeds.

### 5. Content sections registry + expanded palettes

**`builderSectionPalettes.ts`** — add `CONTENT_SECTIONS` map (swappable main content types per surface):

| Surface | Content sections |
|---|---|
| `quick_site` (Esite) | `services`*, `properties`, `rooms`, `booking_calendar`, `programs`, `tours`, `team`, `services_pricing` |
| `eshop` | `products`*, `featured_products`, `deals`, `flash_sale`, `reviews` |
| `store_listing` (Estore) | `listings`*, `supplier_catalog`, `bulk_products`, `agriculture_produce`, `manufacturer_products` |
| `community_group` | `about`*, `coaching`, `courses`, `live_webinars`, `workshops`, `mentorship`, `resources`, `discussions` |
| `live_bio` (Influencer) | `links`*, `live_stream`, `live_selling`, `affiliate_products`, `media_feed`, `merch`, `tips_support`, `collabs` |
| `emenu` | `menu`* (fixed, no alternatives) |

(*= default)

Add `GENERAL_SECTIONS` (shared): `text`, `gallery`, `testimonials`, `faq`, `contact`, `cta`, `video`, `schedule`.

Add default schemas for all new types in `DEFAULT_SCHEMAS`.

### 6. `switchMainContent` in `useBuilderEditor.ts`

New function:
1. Calls `builder_switch_main_content` RPC with page_id, new type, default schema
2. On success, calls `applyTemplateForMainContent()` stub (Fix #4)
3. Invalidates query cache
4. Shows toast: "Switched to {label}"

Exposed in hook return alongside existing functions.

### 7. Split "Add Section" popover

**`BuilderAddSection.tsx`** changes:
- New prop: `onSwitchMainContent: (newType: string) => Promise<void>`
- New prop: `currentMainContentType?: string`
- Popover splits into two labeled groups:
  - **"Switch Content Type"** — content sections for current surfaceType, current type disabled/highlighted
  - **"Add Section"** — general sections only
- "Ada AI" button stays as-is

### 8. `PropertiesEditor.tsx` (new file)

Full real estate editor:
- Stats bar: Total Properties, Listed Value, Active Listings
- Property cards list with Sale/Rent badges
- "Add Property" dialog: Title, Type (Sale/Rent toggle), Price, Currency, Location, Bedrooms, Bathrooms, Size, Description, Photos (MediaPicker), Amenities tags, Status
- All stored in section schema JSON (no new DB tables)

### 9. Wire up editors

**`BuilderSectionEditor.tsx`** — add to `FORM_MAP`:
- `properties` → `PropertiesEditor`
- All other new types → reuse `ItemListForm` with appropriate heading as placeholder editors

**`BuilderSectionList.tsx`** — add `TYPE_LABELS` for all new section types.

### 10. Update `builderCoreSections.ts`

- Add `CONTENT_SECTION_TYPES` set (all possible main content types across categories)
- `enforceCoreSectionOrder`: recognize any content section type as occupying `main_content` slot (check `core_slot` column first, then fallback to type-in-set)
- `MAIN_CONTENT_MAP` stays for default resolution; `CONTENT_SECTION_TYPES` used for detection

---

### Build Order
1. DB migration: `core_slot` column + `builder_switch_main_content` RPC
2. `builderSectionPalettes.ts` — all new types, schemas, content/general split
3. `builderCoreSections.ts` — `CONTENT_SECTION_TYPES`, updated detection
4. `useMainContentTemplate.ts` — stub hook
5. `PropertiesEditor.tsx` — full editor
6. `useBuilderEditor.ts` — `switchMainContent` function + core_slot in auto-create
7. `BuilderAddSection.tsx` — split popover
8. `BuilderSectionList.tsx` — "Core: Content" badge + switch icon + new labels
9. `BuilderSectionEditor.tsx` — wire all new editors

### Files to Create
- `src/hooks/useMainContentTemplate.ts`
- `src/components/builder/editors/PropertiesEditor.tsx`

### Files to Modify
- `src/config/builderSectionPalettes.ts`
- `src/config/builderCoreSections.ts`
- `src/hooks/useBuilderEditor.ts`
- `src/components/builder/BuilderAddSection.tsx`
- `src/components/builder/BuilderSectionList.tsx`
- `src/components/builder/BuilderSectionEditor.tsx`

### Database Migration
- Add `core_slot` column to `builder_sections`
- Create `builder_switch_main_content` RPC
- Backfill existing sections with correct `core_slot` values

