

# Blog Page -- 1:1 Every.to Homepage Clone (Revised)

## Overview
Create a strict, pixel-perfect clone of the Every.to homepage at `/blog`. No YANGU branding changes, no invented sections. Every section, interaction, and visual detail matches the reference exactly. Branding swap is a separate future phase.

## File Structure

```text
src/components/mass/blog/
  BlogPage.tsx              -- Full-page shell (black bg, no sidebar)
  BlogHeader.tsx            -- Sticky: hamburger + search (left), "Sign in" + "Subscribe" (right)
  BlogHero.tsx              -- "EVERY" logo, divider, headline, subtext, Subscribe CTA
  BlogStampStrip.tsx        -- 6 postage stamps in a single scrollable row at ALL breakpoints
  BlogFeaturedGrid.tsx      -- 3-column: left cards, center feature, right "Recent Essays" list
  BlogSectionModule.tsx     -- Reusable: section heading + subtitle + arrow + card grid
  BlogArticleCard.tsx       -- Image + date + column tag + title + subtitle + author
  BlogEssayItem.tsx         -- Thumbnail + title row (Recent Essays sidebar)
  BlogProductCard.tsx       -- Product thumbnail + name + description + "Try it" link
  BlogColumnistBlock.tsx    -- Author spotlight (image, bio, article list)
  BlogPodcastSection.tsx    -- Podcast artwork + description + episode list
  BlogConsultingBanner.tsx  -- Bottom CTA banner
  BlogExplorePanel.tsx      -- Fixed bottom-right popup
  BlogSubscribeModal.tsx    -- Auto-triggered subscribe modal (split layout)
  BlogFooter.tsx            -- Minimal footer if present on reference
  blogData.ts               -- All mock data
  index.ts                  -- Barrel exports
src/pages/Blog.tsx          -- Route wrapper
```

## Routing

- Add `<Route path="/blog" element={<Blog />} />` in `App.tsx`
- Update `MassSidebar.tsx` to navigate to `/blog` on "Blog" click

## Exact Section Order (top to bottom, matching Every.to)

1. **Sticky Header** -- hamburger + search (left), "Sign in" + rounded "Subscribe" button (right). White on black. Thin bottom border.

2. **Hero** -- Large serif "EVERY" logo centered, thin divider, headline, subtext "Trusted by 100,000 builders", mint "Subscribe" button. Centered with generous vertical spacing.

3. **Stamp Strip** -- 6 stamps in a single horizontal row: Read, Email, Speak, Listen, Write, Organize. Scalloped edges via CSS radial-gradient mask. Bold colored backgrounds, icon placeholders. Hover: "with [Product]" text fades in, translateY(-2px), shadow increase. **At ALL screen sizes the strip stays a single row -- on narrower viewports it scrolls horizontally (overflow-x: auto, flex-nowrap). Never wraps to multiple rows.**

4. **Featured Content Grid** -- 3-column: left 2 stacked cards, center large feature, right "RECENT ESSAYS" list (4 items).

5. **"Built by Every"** -- 4-column product cards (Monologue, Sparkle, Cora, Spiral).

6. **"Ideas and Apps" interstitial** -- Centered logo + heading + chip strip + dashed separator.

7. **"Every Studio"** -- Heading + 4 article cards.

8. **"Dispatches From the Frontiers of AI"** -- Heading + 4 article cards.

9. **Second "Ideas and Apps" interstitial** -- Same layout repeated.

10. **"Putting AI to Work"** -- Heading + 4 article cards.

11. **"The Future of Programming"** -- Heading + 4 article cards.

12. **"The New Rules of Writing"** -- Heading + 4 article cards.

13. **"From Our Columnists"** -- Author spotlight (Dan Shipper) + 3 article cards.

14. **Podcast** -- Artwork, description, platform icons, 3 episode cards.

15. **Consulting CTA Banner** -- "Stop Planning Your AI Strategy..." + "Learn more" + illustration placeholder.

16. **Explore Panel** -- Fixed bottom-right trigger. Dark panel with icon list. Close on ESC/outside click. Scale+fade animation.

17. **Subscribe Modal** -- 35% scroll OR 10s trigger, once/day localStorage. Split: left white (headline, checklist, email input, CTA, "Maybe later"), right warm bg (product image, pill tag). Focus trap. Close via X/overlay/ESC/"Maybe later".

## Interactions

| Element | Behavior |
|---|---|
| Stamp tiles | "with [X]" text fade in (200ms), translateY(-2px), shadow increase |
| Article cards | Image zoom (scale 1.02), card lift, title brightness |
| "Try it" links | Arrow shifts right 2px |
| Section arrows | Shift right on hover |
| Subscribe button | Brightness increase |
| Explore panel items | Background highlight, icon color shift |

## Scroll Animations

- IntersectionObserver (threshold 0.1) per section
- opacity 0 to 1, translateY 8px to 0, 400ms ease-out
- One-time trigger only

## Visual Specs

- Background: `#000000`
- Text: `#FFFFFF` headings, `rgba(255,255,255,0.7)` body
- Serif: `Georgia, 'Times New Roman', serif` for logo/headlines
- Subscribe button: `#C5F0E0` fill, dark text
- Dividers: `rgba(255,255,255,0.15)` 1px, some dashed
- Max content width: ~1100px centered
- Card bg: `#111111` / `#1a1a1a`

## Responsive Strategy

- **Desktop** (1440px+): full reference layout
- **Tablet** (768-1024px): grids collapse to 2 columns; **stamp strip stays a single horizontal row with horizontal scroll** (overflow-x auto, flex-nowrap, hide scrollbar with `scrollbar-width: none` / `::-webkit-scrollbar { display: none }`)
- **Mobile** (<768px): single column; stamp strip same single-row horizontal scroll; header compacts

## Files Modified

- `src/App.tsx` -- add `/blog` route
- `src/components/mass/MassSidebar.tsx` -- add blog nav handler

## Technical Notes

- No backend, auth, database, or platform logic changes
- Fully isolated in `src/components/mass/blog/`
- Scalloped edges via CSS `radial-gradient` mask-image
- All content from local `blogData.ts` mock data
- Subscribe modal localStorage key: `every_subscribe_modal_last_shown`

