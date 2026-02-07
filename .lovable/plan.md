

# Landing Page Update: Match Reference Design Exactly

This plan updates the current landing page to match the screenshot reference exactly, including all visual elements, colors, and layout changes.

## Overview of Changes

The current page will be updated to match the Yangu-branded version with:
- Yangu logo in sidebar and hero
- Orange accent color scheme (replacing green)
- Header with auth buttons on the right
- Live trends banner below the logo
- Search bar between hero and cards
- Updated hero text
- Glass-style featured star icons

---

## 1. Asset Setup

**Copy uploaded logo files to project:**
- Copy `yangu_logo-3.png` to `src/assets/yangu-logo.png` for sidebar use
- Copy `3_1-2.png` to `src/assets/yangu-y-icon.png` for hero 3D element

---

## 2. Sidebar Updates (MassSidebar.tsx)

**Changes:**
- Replace the Mass logo SVG with Yangu logo image
- Update navigation items to match reference:
  - Explore (active by default)
  - Discover Yangu
  - Why Yangu
  - Ada ai
  - Blog
  - Community
  - Affiliates
  - Terms
  - Privacy
- Keep "Endorsed by Plaiter" section at bottom
- Add social icons (YouTube, Twitter, Instagram) at the bottom

---

## 3. Add Global Header Component (MassHeader.tsx)

**New component with:**
- Yangu logo on the left (links to home)
- "View Trends" button in orange (`#f97316`) with arrow icon
- Scrolling trend ticker bar with items:
  - "triple your sales this month"
  - "automated invoicing - get paid fast"
  - "sign documents digitally"
  - "manage all documents in one place"
  - "build your company knowledge base"
  - "email marketing that converts"
- Right side: "Sign in" button (outline) and "Start selling" button (orange fill `#f97316`)

---

## 4. Hero Section Updates (MassHero.tsx)

**Text changes:**
- Title line 1: "Build and." (white)
- Title line 2: "Sell Online." (gray `#999999`)
- Subtitle: "An Internet Business hub that exists to deliver sustainable income for everyone."

**Visual changes:**
- Replace the "4" SVG with the 3D metallic Y logo from the uploaded image
- Position the Y logo on the right side of the hero

---

## 5. Add Search Bar Component (MassSearchBar.tsx)

**New component between hero and cards:**
- Dark rounded input field with border (`#333333`)
- Search icon on the left
- Placeholder text: "Search to buy, learn create or sell..."
- Microphone icon on the right
- Centered, max-width constrained

---

## 6. Resource Card Star Icon Update (MassResourceCard.tsx)

**Change the featured star:**
- Replace the green filled star with a glass-effect star
- Use a gradient/glossy appearance matching the reference
- Colors: subtle gray/white glass effect instead of green `#4ade80`

---

## 7. Main Layout Updates (MassLandingPage.tsx)

**Structural changes:**
- Add MassHeader component above the main content area
- Add MassSearchBar between MassHero and resource sections
- Remove MassTopBar (replaced by MassHeader)

---

## 8. Color Scheme Updates

**Orange accent color (`#f97316`) replaces green (`#4ade80`) for:**
- "View Trends" button text and icon
- "Start selling" button background
- Any accent highlights

---

## File Summary

| File | Action |
|------|--------|
| `src/assets/yangu-logo.png` | Create (copy from user upload) |
| `src/assets/yangu-y-icon.png` | Create (copy from user upload) |
| `src/components/mass/MassHeader.tsx` | Create new component |
| `src/components/mass/MassSearchBar.tsx` | Create new component |
| `src/components/mass/MassSidebar.tsx` | Update logo and nav items |
| `src/components/mass/MassHero.tsx` | Update text and hero image |
| `src/components/mass/MassResourceCard.tsx` | Update star icon style |
| `src/components/mass/MassLandingPage.tsx` | Add header and search bar |
| `src/components/mass/MassTopBar.tsx` | Delete (replaced by header) |
| `src/components/mass/index.ts` | Update exports |

---

## Technical Notes

- Yangu logo imported as ES6 module from `src/assets`
- Orange color: `#f97316` (Tailwind `orange-500`)
- Glass star effect uses CSS gradients and backdrop blur
- Trend ticker uses CSS animation for horizontal scroll
- All existing routing, auth, and backend functionality remains unchanged

