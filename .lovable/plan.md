

## Plan: Fix Main Content Switching + Industry-Aware Palette

### Problem
1. The `builder_switch_main_content` RPC only archives rows where `core_slot = 'main_content'`. Pre-migration sections have `core_slot = NULL`, so they aren't archived — switching silently fails.
2. The content palette shows all 8 quick_site options regardless of industry.
3. Industry metadata isn't wired to the switcher.

### Changes

#### 1. Database Migration
**A) Backfill** `core_slot = 'main_content'` on existing `builder_sections` where `core_slot IS NULL` AND `section_type` is in the known content types set.

**B) Update `builder_switch_main_content` RPC** to archive sections matching content types even when `core_slot IS NULL`:
```sql
-- Archive: core_slot='main_content' OR (core_slot IS NULL AND section_type in content types)
UPDATE builder_sections SET is_visible = false, core_slot = 'main_content'
WHERE page_id = p_page_id
  AND is_visible = true
  AND (core_slot = 'main_content' 
       OR (core_slot IS NULL AND section_type IN ('services','products','menu','listings','about','links','properties','rooms','booking_calendar','programs','tours','team','services_pricing',...)));
```
Also grab `v_old_position` from this wider match.

**C) Cleanup** orphaned archived rows: delete `is_visible = false` + `core_slot = 'main_content'` rows where `schema` is `'{}'` or matches exact default schemas (no user data).

#### 2. Industry-Aware `getContentSections` (`builderSectionPalettes.ts`)
Update signature to `getContentSections(surfaceType, industry?)`. For `quick_site`:
- Default/Other: Services, Team, Services & Pricing
- Real Estate: Properties, Services, Team
- Hospitality: Rooms, Booking Calendar, Services
- Clinic/Salon/Spa: Booking Calendar, Services, Services & Pricing
- School/Education: Programs, Services, Team
- Tourism: Tours, Booking Calendar, Services

Other surface types unchanged (return full `CONTENT_SECTIONS[surfaceType]`).

#### 3. Wire Industry Context
- **`BuilderEditor.tsx`**: Extract `industry` from `editorState.surface.metadata.industry`, pass to `BuilderSectionList`.
- **`BuilderSectionList.tsx`**: Accept `industry` prop, pass to `MainContentSwitcher`.
- **`MainContentSwitcher.tsx`**: Accept `industry` prop, call `getContentSections(surfaceType, industry)`.

#### 4. UX Unchanged
- Row click = edit (already correct)
- Swap icon = switch popover (already correct)
- Label: "Main Content" + "Currently: X" (already correct)

### Files Changed
- New migration SQL (backfill + RPC update + cleanup)
- `src/config/builderSectionPalettes.ts` — industry-aware `getContentSections`
- `src/components/builder/MainContentSwitcher.tsx` — accept `industry` prop
- `src/components/builder/BuilderSectionList.tsx` — accept + pass `industry`
- `src/pages/BuilderEditor.tsx` — extract + pass `industry`

