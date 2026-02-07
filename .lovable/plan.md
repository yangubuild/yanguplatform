
# YANGU Landing Page Redesign - 1:1 Clone Implementation

## Overview

Replace the current "/" landing page with an exact replica of the provided Digital Community screenshot. This involves a complete layout transformation from a traditional top-header marketing page to a sidebar-based "Explore" layout.

---

## Design Specifications (From Screenshot)

### Color Palette
| Element | Color |
|---------|-------|
| Background | Pure black (#0a0a0a / #080808) |
| Sidebar | Dark charcoal (#111111) |
| Accent (active states, CTAs) | Orange/Coral (#E97451 / #E8734A) |
| Primary text | White (#FFFFFF) |
| Secondary text | Gray (#888888 / #666666) |
| Card backgrounds | Dark gray (#1a1a1a) with subtle borders |
| Trend pills | Dark background (#1a1a1a) with light borders |

### Layout Structure
```text
+------------------+------------------------------------------------+
|                  |  [Trend Marquee - scrolling horizontal ticker] |
|    SIDEBAR       +------------------------------------------------+
|    (240px)       |                                 [Sign in] [CTA]|
|                  +------------------------------------------------+
|  Logo            |                                                |
|  Navigation      |   "Build and."                    [3D Y Logo]  |
|  Items           |   "Sell Online."                               |
|  (stacked)       |   subtitle text                                |
|                  |                                                |
|  Social Icons    |   [==========  Search Bar  ============]       |
|  Plaiter Badge   |                                                |
|                  |   FEATURED                                     |
|                  |   [Card 1] [Card 2] [Card 3]                   |
+------------------+------------------------------------------------+
```

---

## Assets to Copy

1. **Main Logo** (`yangu_logo-2.png`) - Copy to `src/assets/yangu-logo.png`
2. **3D Hero Logo** (`3_1.png`) - Copy to `src/assets/yangu-3d-logo.png`

---

## New Components to Create

### 1. LandingSidebar
**File**: `src/components/landing/LandingSidebar.tsx`

Navigation items (from screenshot):
- Explore (active - orange background pill)
- Discover Yangu
- Why Yangu
- Ada ai
- Blog
- Community
- Affiliates
- Terms
- Privacy

Bottom section:
- Social icons row (YouTube, X/Twitter, Instagram)
- "Endorsed by" Plaiter badge

### 2. TrendMarquee
**File**: `src/components/landing/TrendMarquee.tsx`

Infinite horizontal scrolling ticker containing:
- "View Trends" link with orange icon
- Trend pills: "triple your sales this month", "automated invoicing - get paid fast", "sign documents digitally", "manage all documents in one place", etc.

### 3. LandingHeader
**File**: `src/components/landing/LandingHeader.tsx`

Minimal header for main content area:
- "Sign in" button (ghost/outlined)
- "Start selling" button (orange/coral filled)

### 4. HeroNew
**File**: `src/components/landing/HeroNew.tsx` (new file to avoid conflicts)

Layout:
- Left side: "Build and." / "Sell Online." (stacked headlines) + subtitle
- Right side: Large 3D "Y" logo image

### 5. SearchBar
**File**: `src/components/landing/SearchBar.tsx`

Full-width search input:
- Dark background
- Rounded corners (pill shape)
- Placeholder: "Search to buy, learn create or sell..."
- Microphone icon on right

### 6. FeaturedCards
**File**: `src/components/landing/FeaturedCards.tsx`

"FEATURED" section with 3-column grid:
- Card 1: "Social & Media Agency" (Inspiration)
- Card 2: "Job Search" (Templates)
- Card 3: "Real Estate" (Inspiration)
- Each card has image placeholder, title, category badge

### 7. LandingLayout
**File**: `src/components/landing/LandingLayout.tsx`

Wrapper component combining:
- LandingSidebar (fixed left)
- Main content area (scrollable right)
- TrendMarquee at top of main area
- LandingHeader below marquee

---

## Files to Modify

### `src/pages/Index.tsx`
Complete replacement of content to use new LandingLayout

### `src/index.css`
Add new CSS for:
- Landing page dark theme override (forced dark on "/" only)
- Marquee animation keyframes
- Orange accent color variables for landing
- Sidebar-specific styles

### `tailwind.config.ts`
Add marquee animation keyframe

---

## Technical Details

### Routing Verification
The "/" route is already public in `App.tsx` (line 46):
```tsx
<Route path="/" element={<Index />} />
```
No ProtectedRoute wrapper - users can access without authentication.

### Dark Theme Forcing
The landing page needs to force dark mode regardless of user preference. This will be handled via a layout wrapper class.

### Responsive Behavior
- **Desktop (1024px+)**: Full sidebar visible
- **Tablet (768-1023px)**: Collapsible sidebar with hamburger
- **Mobile (<768px)**: Bottom sheet navigation or slide-out drawer

### Marquee Animation
CSS infinite scroll animation with `translateX` and pause on hover.

---

## Implementation Order

1. Copy logo assets to `src/assets/`
2. Create LandingSidebar component
3. Create TrendMarquee component with animation
4. Create LandingHeader component
5. Create SearchBar component
6. Create HeroNew component
7. Create FeaturedCards component
8. Create LandingLayout wrapper
9. Update src/index.css with marquee animation and landing-specific styles
10. Update tailwind.config.ts with marquee keyframe
11. Replace src/pages/Index.tsx content

---

## Exact Visual Matches Required

| Element | Exact Specification |
|---------|---------------------|
| Sidebar width | 240px desktop |
| Logo | Yellow/orange Y icon + "yangu" text (white) |
| Active nav item | Orange background pill (#E97451) |
| Nav item text | White, ~14px, medium weight |
| Trend pills | Dark bg, light border, ~12px text |
| "View Trends" | Orange icon + orange text |
| Hero headline | Large bold "Build and." / "Sell Online." |
| Subtitle | Gray muted text below headline |
| 3D Logo | Right-aligned, large decorative element |
| Search input | Full width, dark bg, rounded-full |
| Featured label | Uppercase "FEATURED" in muted gray |
| Cards | 3 columns, image + title + category tag |
| Sign in button | Ghost/outlined style |
| Start selling button | Solid orange (#E97451) fill |

---

## Files Not Modified

Per requirements, these remain unchanged:
- All dashboard pages
- All auth pages (/auth/*)
- All protected routes
- All other components outside landing/
- Routing configuration (App.tsx routes structure)
