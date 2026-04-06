
# Audit: Shared Editor Engine + Category Capability Packs + AI Intent Routing

---

## 1. CURRENT STATE AUDIT

### ✅ What already exists correctly

| Component | Status | Notes |
|---|---|---|
| `BuilderEngine` type | ✅ Exists | Each category has `key`, `editorModules`, `templates`, `aiGenerationRules` |
| 6 engine configs | ✅ Exists | `emenu`, `eshop`, `estore`, `esite`, `influencer`, `community` — all in `src/lib/builder/engines/` |
| Engine registry | ✅ Exists | `engineRegistry.ts` with `getEngine()`, `getEngineForSurfaceType()` |
| `editorModules` per category | ✅ Defined | Each engine declares its module list |
| `industryModules` for esite | ✅ Defined | e.g. `real_estate: ["listings"]`, `hospitality: ["booking"]` |
| `BuilderEditorRouter` | ✅ Exists | Routes by `surface_type` → Seller / Influencer / Community editors |
| `SellerMode` config | ✅ Exists | Drives sidebar labels per seller subtype |

### ❌ What is MISSING

| Gap | Impact |
|---|---|
| **No AI intent classification** | Builder silently builds whatever user describes inside whatever category they started in — no mismatch detection |
| **No category switch flow** | No mechanism to warn user and offer category switch mid-onboarding |
| **`editorModules` not wired to UI** | The module arrays exist in engine configs but are NOT consumed by the actual editor panels — editor shows same controls for all |
| **No capability pack abstraction** | Modules are flat string arrays, not structured feature packs with UI components, permissions, and dependencies |
| **No cross-category feature sharing** | e.g. Estore should inherit eshop features + add wholesale — currently these are independent flat lists |
| **Community/Influencer editors are placeholders** | Only stubs exist |

### ⚠️ Partially correct

| Component | Issue |
|---|---|
| Emenu editor tools | Editor has emenu-specific controls (menu items, categories) but they're hardcoded in `EditorToolsPanel`, not driven by `engine.editorModules` |
| Template system | Only emenu has real templates; other categories have schema stubs only |

---

## 2. CAPABILITY PACK ARCHITECTURE (Proposed)

### Definition

A **Capability Pack** is the set of feature modules a category exposes in the editor. It maps `editorModules` strings to actual UI panel components and backend features.

```
Category → Engine Config → editorModules[] → Capability Pack → UI Panels
```

### Pack contents per category

| Category | Core Modules | Extended Modules (future) |
|---|---|---|
| **Emenu** | menu_items, menu_categories, hours, order_settings, contact, social, food_image_ai | reservation (conditional), delivery_apps |
| **Eshop** | products, collections, cart, checkout, discount_rules, promos, review_settings, contact | shipping, tax, inventory |
| **Estore** | *inherits eshop* + catalog, bulk_pricing, quote_request, supplier_info, large_inventory | multi-seller, dealer, marketplace |
| **Esite** | services, team, testimonials, contact, faq, blog + *industry modules* (bookings, listings, calendar) | Zoom/Meet integrations, appointment scheduling |
| **Community** | member_signup, events, programs, resources, private_posts, directory, messaging | courses, ebooks, merch, bookings |
| **Influencer** | bio, links, media, affiliate, live_product_pins, tips, contact | sponsorships, analytics |

### Shared editor core (unchanged across all)

- Direct in-canvas text editing
- Side panel logic
- Media library
- Page/section/element controls
- One-page scroll-first behavior
- Selection sync
- Context styling (Phase IV)

---

## 3. AI INTENT ROUTING (Proposed)

### Flow

```
User enters builder with category X
  → User describes their business
  → AI classifies intent keywords
  → Compare classified category vs selected category
  → If match: proceed normally
  → If mismatch: show warning + offer switch
```

### Classification logic

Use keyword matching from existing `CATEGORY_CONFIGS.keywords` + extended keyword sets:

| Detected keywords | Maps to |
|---|---|
| restaurant, cafe, menu, food, delivery | emenu |
| shop, retail, fashion, products, clothing | eshop |
| wholesale, bulk, supplier, agriculture, marketplace, dealer | estore |
| booking, hotel, consultant, agency, law, medical, portfolio, real estate | esite |
| course, community, training, ebook, membership, group | community |
| creator, influencer, streamer, content, vlogger | influencer |

### Mismatch response

```
"It looks like you're describing a [detected type] business. 
You started in [current category]. 

Would you like to:
→ Switch to [detected category] (recommended)
→ Stay in [current category]
→ Go back to dashboard"
```

### Where to implement

- In the onboarding AI chat flow (`useBuilderChat` or equivalent)
- After user's first business description message
- Before template selection begins

---

## 4. IMPLEMENTATION PLAN (Phased)

### Phase A — Wire `editorModules` to editor UI
- Make `EditorToolsPanel` read `engine.editorModules` and only render matching tool sections
- Create a module→component registry (map strings like `"menu_items"` to actual panel components)
- Current emenu tools become the first registered module components
- **No new features added, just proper wiring**

### Phase B — AI Intent Classification
- Add `classifyUserIntent(text: string): Category` utility using keyword matching from engine configs
- Wire into onboarding chat flow after first user message
- Add mismatch warning UI with switch/stay/back options
- If switch accepted: update `surface_type` in DB, reload correct engine

### Phase C — Capability Pack Inheritance
- Define pack inheritance (estore extends eshop modules)
- Add `extends?: string` to `BuilderEngine` type
- Merge parent + child modules at runtime

### Phase D — Module Component Registry (per category)
- Register placeholder panels for non-emenu modules (products, services, etc.)
- Each module panel follows same shared component interface
- Renders based on active engine's `editorModules`

---

## 5. WHAT THIS DOES NOT TOUCH

- ❌ Builder shell design
- ❌ Reservation flow
- ❌ Template system / registry
- ❌ Seller → Emenu wiring
- ❌ Eshop implementation
- ❌ Checkout/cart systems

---

## 6. RECOMMENDED EXECUTION ORDER

1. **Phase A** first — makes the architecture honest (editor actually respects engine config)
2. **Phase B** next — prevents wrong-category builds
3. **Phase C + D** later — enables real multi-category editing
