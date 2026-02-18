

# Fix ADA AI Layout: Dashboard + Landing Separation + Bottom Section

## Summary

Two major changes needed:
1. Put `/ada-ai` back inside the dashboard navigation shell (like `/studio`)
2. Add a bottom section with "ALL CHAT", "IMAGES", and icon row (matching the reference screenshot)
3. Create a public landing ADA page at `/ada` with MassSidebar + content sections

## Current Problems

- `/ada-ai` route (line 216-223 in App.tsx) is NOT wrapped in `NavigationDashboardPage` -- it renders standalone with no dashboard navigation
- The `AdaMainPanel` has `lg:ml-[280px]` (line 1529) assuming it sits next to AdaSidebar, but there is no bottom section with ALL CHAT / IMAGES / icons
- The landing page version (public, no auth) with content sections (steps, features, reviews, FAQ) is not accessible

## Changes

### 1. Routing -- `src/App.tsx`

- Wrap `/ada-ai` inside `NavigationDashboardPage` (same pattern as `/studio` at lines 206-215)
- Add new public route `/ada` that renders a `LandingAdaPage` (no auth required)
- Update `/dashboard/ada` redirect to still point to `/ada-ai`

### 2. Dashboard ADA Layout -- `src/components/mass/ada/AdaAiPage.tsx`

- Remove the inline `AdaSidebar` (the history sidebar)
- `AdaMainPanel` renders directly as the dashboard content panel

### 3. Fix AdaMainPanel -- `src/components/mass/ada/AdaMainPanel.tsx`

- Remove `lg:ml-[280px]` from the main element (line 1529) -- dashboard shell handles this
- Add `+ New Chat` button at top-left (plain white text, orange on hover) alongside the Extensions button at top-right
- Add the Ada AI logo (import `ada-logo-full.png`) above the "Build your Own!" heading
- Add a **bottom section** after the disclaimer, containing:
  - **Left column**: "ALL CHAT" header with search icon, chat history list grouped by "30 Days" (reuses the same data loading logic from AdaSidebar)
  - **Center column**: "IMAGES" header with generated image grid (pulls from ada_media or session media)
  - **Right column**: Row of 5 icons (Globe, CloudUpload, Palette, Code2, BarChart3) matching the reference screenshot exactly
- The bottom section replaces the vertical AdaSidebar concept for the dashboard view

### 4. Landing ADA Page -- New Files

**`src/components/mass/ada/LandingAdaPage.tsx`** (new):
- Uses MassSidebar (240px left sidebar with Explore, Ada ai, Blog, etc.)
- MassHeader (Sign in / Start selling buttons + trends bar) at the top
- A lightweight copy of the ADA chat hero (title, mode switcher, input, action chips, connected modules, disclaimer) -- no auth required, uses guest/anon flow
- Below that, renders `AdaContentSections` (4 Steps, Features, Reviews, FAQ)
- Dark background with the same radial gradient

**`src/pages/AdaLanding.tsx`** (new):
- Simple page wrapper that renders `LandingAdaPage`

### 5. Update AdaContentSections -- `src/components/mass/ada/AdaContentSections.tsx`

- Remove `lg:ml-[280px]` from the wrapper div (line 47) -- the landing page layout handles the sidebar offset

### 6. Update MassSidebar link -- `src/components/mass/MassSidebar.tsx`

- Change "Ada ai" navigation target from `/ada-ai` to `/ada` (the public landing route)

### 7. Replace Ada logo asset

- Copy uploaded logo (`user-uploads://Logo-01_1_-2.png`) to `src/assets/ada-logo-full.png`

## Bottom Section Detail (Matching Reference Screenshot)

The bottom section layout:

```text
+------------------------------------------------------------------+
|                                                                    |
|  ALL CHAT        [Q]    |    IMAGES           | [5 icon buttons]  |
|                         |                     |                    |
|  30 Days                |  [image 1] [image 2]| Globe              |
|  Yangu AI WEEK 2026...  |                     | CloudUpload        |
|  Clinic Manager and...  |                     | Palette            |
|  Yangu Platform Lau...  |                     | Code2              |
|  Basketball Club Se...  |                     | BarChart3          |
|  Investor Verificat...  |                     |                    |
|  PostgreSQL Functio...  |                     |                    |
+------------------------------------------------------------------+
```

- "ALL CHAT" text is large, muted white (like a section header)
- Search icon (magnifying glass) aligned to the right of "ALL CHAT"
- "30 Days" is a date grouping label
- Chat items are truncated text with ellipsis and a "..." more button
- "IMAGES" is centered between chat list and icons
- Image thumbnails are large preview cards
- 5 icons on the far right are the same command icons from AdaSidebar (Globe, CloudUpload, Palette, Code2, BarChart3) rendered vertically

## Files Created
- `src/components/mass/ada/LandingAdaPage.tsx`
- `src/pages/AdaLanding.tsx`

## Files Modified
- `src/App.tsx` -- routing changes
- `src/components/mass/ada/AdaAiPage.tsx` -- remove AdaSidebar
- `src/components/mass/ada/AdaMainPanel.tsx` -- remove left margin, add logo, add + New Chat, add bottom section
- `src/components/mass/ada/AdaContentSections.tsx` -- remove left margin
- `src/components/mass/MassSidebar.tsx` -- update Ada link

## Files NOT Modified
- No changes to Studio, Community, Blog, or any other pages
- No changes to ADA business logic, chat, image generation, or AI features
- No changes to dashboard navigation structure

