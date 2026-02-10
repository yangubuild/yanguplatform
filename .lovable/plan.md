

# Add Community Page (discover.circle.so replica)

## Scope

Add a pixel-accurate replica of `discover.circle.so` as a new `/community` route. This is a purely additive, front-end-only change. No existing routes, auth, logic, or shared UI will be touched.

## What the page looks like (from discover.circle.so)

The page has a white/light background with these sections top-to-bottom:

1. **Top bar** -- Circle logo on left; "Create a Circle", "List on Discover", "Login" (ghost buttons), "Subscribe" (filled purple #7C3AED button) on right
2. **Hero** -- Large heading: "Whatever it is, there's a Circle for that", subtitle: "Find communities, creators, and products that transform your life"
3. **Category filter pills** -- Horizontal scrollable row: Explore (active by default), Be more productive, Start and scale my business, Improve my health, Grow my brand and audience, Build my tech skills, Lead with confidence, Grow my network, Strengthen my relationships, Grow my wealth, Pursue new interests
4. **"Trending" section** -- Grid of community cards (3-col desktop, 2-col tablet, 1-col mobile)
5. **More category sections** below with same card format

Each **community card** has:
- Large thumbnail image (rounded corners, aspect ~16:10)
- Optional price pill overlay (e.g. "From $35 / month") at bottom-left of image
- Community name below the image

## Guardrails (confirmed)

- `/` route: NOT modified -- remains `<Index />`
- `/auth/*` routes: NOT modified
- No redirects, route guards, or layout wrapper changes
- `/community` inserted as a new public route above the `*` catch-all

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/mass/community/CommunityPage.tsx` | Full page: top bar, hero, filters, card grid (white bg, standalone layout) |
| `src/components/mass/community/CommunityHero.tsx` | Hero section -- heading + subtitle on white background |
| `src/components/mass/community/CommunityTopBar.tsx` | Top bar with logo + action buttons |
| `src/components/mass/community/CommunityFilterBar.tsx` | Horizontal scrollable category pills |
| `src/components/mass/community/CommunityCard.tsx` | Card with image, optional price badge overlay, title |
| `src/components/mass/community/CommunitySection.tsx` | Section wrapper ("Trending" heading + card grid) |
| `src/components/mass/community/communityData.ts` | Static data: community items with image URLs, titles, prices, categories |
| `src/components/mass/community/index.ts` | Barrel exports |
| `src/pages/Community.tsx` | Thin page wrapper rendering CommunityPage |

## Files to Modify (minimal, targeted)

| File | Change |
|------|--------|
| `src/App.tsx` | Add import for `Community` page; insert `<Route path="/community" element={<Community />} />` after line 48 (the `/` route), before surface routes. No other changes. |
| `src/components/mass/MassSidebar.tsx` | Change the "Community" nav item click handler to navigate to `/community` using `useNavigate` from react-router-dom. Only this one item is changed. |

## Design Specifications

- **Background**: `#FFFFFF` (white) -- distinct from the dark landing page
- **Top bar**: White bg, Circle-style logo (text "Discover" or Yangu-branded), ghost buttons with subtle borders, "Subscribe" button filled purple `#7C3AED`
- **Hero heading**: Black `#111827`, large bold ~48px, centered
- **Hero subtitle**: Gray `#6B7280`, ~18px, centered
- **Filter pills**: Rounded-full, light gray `#F3F4F6` inactive bg, dark `#111827` active bg with white text, horizontally scrollable with hidden scrollbar
- **Card grid**: 3 columns desktop, 2 tablet, 1 mobile, gap-6
- **Cards**: Rounded-xl corners, image fills top portion, optional "From $XX / month" badge (semi-transparent dark bg, white text, positioned bottom-left of image), title below in dark text
- **Typography**: System sans-serif (Inter/default Tailwind)

## Community Data (sample entries matching discover.circle.so)

Categories: Explore, Productivity, Entrepreneurship, Health, Brand and Audience, Tech Skills, Leadership, Networking, Relationships, Wealth, New Interests

Each entry:
```text
{
  image: string (placeholder community thumbnails)
  title: string (community name)
  price?: string (e.g. "From $35 / month")
  category: string
}
```

Approximately 15-20 sample community cards across "Trending" and category sections.

## What is NOT touched

- No auth changes
- No database/backend changes
- No RPC calls
- No shared UI primitives modified
- No existing page component modified
- No route order changes except inserting one new route
- No redirects or guards added
- `/` continues to render `MassLandingPage`
- All `/auth/*` routes unchanged

## Acceptance Checks

- Visiting `/` shows the current dark landing page (unchanged)
- Visiting `/auth/signup` shows signup (unchanged)
- Visiting `/community` shows the new white-background community discovery page
- Clicking "Community" in the sidebar navigates to `/community`

