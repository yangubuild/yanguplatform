
# YANGU Builder — Category Routing & Seller Editor Plan

## A. Routing Plan

**Current:** `/builder/:surfaceId` → `BuilderEditor` (generic, same for all)

**New:** `/builder/:surfaceId` → `BuilderEditorRouter` (thin wrapper that reads `surface_type` and branches)

| surface_type | Routes to | Status |
|---|---|---|
| `emenu` | `SellerEditor` | ✅ Full (this phase) |
| `eshop` | `SellerEditor` | ✅ Full (this phase) |
| `estore` | `SellerEditor` | ✅ Full (this phase) |
| `quick_site` (esite) | `SellerEditor` | ✅ Full (this phase) |
| `live_bio` | `InfluencerEditorPlaceholder` | 🔲 Stub only |
| `community_group` | `CommunityEditorPlaceholder` | 🔲 Stub only |

**Implementation:** `BuilderEditorRouter.tsx` fetches `surface_type` from `builder_surfaces`, then renders the correct editor component. Loading/error states handled here once.

---

## B. Seller Editor Plan

**Rename:** Current `BuilderEditor.tsx` (777 lines) → becomes `SellerEditor.tsx`

**Category-awareness via engine lookup:**
- On mount, resolve `surface_type` → engine key (using existing `getEngineForSurfaceType`)
- Engine provides: `editorModules`, `templates`, `aiGenerationRules`
- These drive which panels, section tools, and add-section options appear

**What changes per seller subtype:**

| Feature | emenu | eshop | estore | esite |
|---|---|---|---|---|
| Add Section list | menu, hero, location, delivery | products, hero, cart, order | catalog, hero, inquiry | services, hero, contact, booking |
| Module panels | Menu editor | Product manager | Catalog manager | Service editor |
| Preview hint | Food-themed | Commerce-themed | Industrial/catalog | Professional/service |

**How:** The existing `BuilderAddSection` and section type labels will filter based on `engine.templates` and `engine.aiGenerationRules.allowedSectionTypes`. No new components needed — just pass the engine config down.

---

## C. File Structure Plan

### Shared (NO changes):
- `src/components/builder-new/*` (entry, wizard, AI onboarding, chat)
- `src/lib/builder/engines/*` (all 6 engine configs)
- `src/lib/builder/engineRegistry.ts`
- `src/hooks/useBuilderEditor.ts`
- `src/hooks/useBuilderSurfaceInit.ts`
- `src/components/builder/*` (BuilderPreview, BuilderSectionList, etc.)

### New files:
```
src/pages/BuilderEditorRouter.tsx      ← thin router (reads surface_type, branches)
src/pages/SellerEditor.tsx             ← renamed from BuilderEditor.tsx + engine-aware
src/pages/InfluencerEditorPlaceholder.tsx  ← stub
src/pages/CommunityEditorPlaceholder.tsx  ← stub
```

### Modified files:
```
src/App.tsx                            ← /builder/:surfaceId → BuilderEditorRouter
src/components/builder/BuilderAddSection.tsx  ← filter by engine.allowedSectionTypes
```

---

## D. Placeholder Plan

**InfluencerEditorPlaceholder:**
- Full-screen card with back-to-dashboard button
- Shows surface title + "Influencer bio editor coming soon"
- No functionality

**CommunityEditorPlaceholder:**
- Same pattern — "Community editor coming soon"
- No functionality

Both receive `surfaceId` from URL params so they're ready for future wiring.

---

## Execution Order
1. Create `BuilderEditorRouter.tsx` (fetches surface_type, branches)
2. Copy `BuilderEditor.tsx` → `SellerEditor.tsx`, add engine-awareness
3. Create two placeholder editors
4. Update `App.tsx` route to use router
5. Wire `BuilderAddSection` to respect engine config
