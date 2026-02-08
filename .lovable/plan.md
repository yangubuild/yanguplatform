
# Landing Page: Match PDF Design Exactly

This plan updates the landing page to exactly match the PDF screenshot, keeping only the existing card background images unchanged while updating everything else.

## Key Design Elements from PDF

1. **Full Dark Green/Teal Background** - The entire page has a gradient from `#0a1f1a` to `#0f2922` (dark green/teal), not grey/black
2. **Sidebar with "Start Selling" CTA Box** - Blue text CTA box at bottom of sidebar with orange "Start Building" button
3. **Header** - "View Trends" in orange with scrolling ticker, Sign in/Start selling buttons on right
4. **Hero** - Green gradient background, "Build and. Sell Online." text, 3D Y icon
5. **Search Bar** - Centered between hero and cards with search/mic icons
6. **Resource Categories** - FEATURED, LEARN, BUILD, SCALE (not the current categories)
7. **Cards** - Have icons, titles, subtitles and category labels (Sale, Learn, Build, Scale) on each card

---

## Files to Update

### 1. MassLandingPage.tsx
- Change page background from `#0f0f0f` (grey) to dark green gradient
- Update section categories from (Featured, Inspiration, No Code, Templates, Ai, Typography, Design Tools) to (Featured, Learn, Build, Scale)

### 2. MassSidebar.tsx
- Add "Start Selling" CTA box with description text and orange "Start Building" button at bottom (before "Endorsed by" section)
- Keep existing navigation structure

### 3. resourceData.ts
- Update ALL card data to match PDF exactly (titles, subtitles, categories)
- Keep existing image URLs unchanged
- Categories should be: "Sale", "Learn", "Build", "Scale"
- Add subtitle field to each resource

**FEATURED section cards:**
1. Live Shopping - "Sell Products Live" - Sale
2. Ada AI - "Your 24/7 AI assistant" - Sale  
3. Digital E-Shop - "Sell Products Online" - Sale
4. Digital Menu - "Increase your sales with digital menu" - Sale
5. Social Marketing - "Grow Your Audience With AI" - Sale
6. Learn From 1000+ Courses - "(Ebooks, courses, business skills)" - Learn

**LEARN section cards:**
1. Learn From 1000+ Courses - "(Ebooks, courses, business skills)" - Learn
2. Organize Work Every Day - "(Tasks, goals, team planning)" - Learn
3. Documents - "Create And Manage Documents" - Learn

**BUILD section cards:**
1. Business Name Generator - "Find A Business Name with AI" - Build
2. Slogan Generator - "AI Creates A Catchy Slogan for you" - Build
3. Mission Statement Generator - "AI Writes Your Mission" - Build
4. Vision Statement Generator - "AI helps you Define Your Vision" - Build
5. Design A Brand Logo - (Logo builder) - Build
6. Website Builder - "Build Websites With AI" - Build
7. Digital E-Shop - "Sell Products Online" - Build
8. Real Estate - "Sale properties faster with AI" - Build
9. E-Shop Connect - "Connect With Global Wholesalers" - Build
10. Digital Menu - "Increase your sales with digital menu" - Build
11. Digital Signature - "Sign Documents Online" - Build

**SCALE section cards:**
1. Social Marketing - "Grow Your Audience With AI" - Scale
2. Live Shopping - "Sell Products Live" - Scale
3. VLS (Video Live Selling) - "Sell With Live Video" - Scale
4. CRM - "Manage Customer Relationships" - Scale
5. Sales CRM - "Track Leads And Sales" - Scale
6. Email Marketing - "Send Marketing Emails" - Scale
7. Digital Reporting - "Track Business Performance" - Scale
8. Ada AI - "Your 24/7 AI assistant" - Scale

### 4. MassResourceCard.tsx
- Add subtitle display below title
- Show category label on each card (Sale, Learn, Build, Scale in different colors)
- Keep glass star for featured cards

### 5. MassResourceSection.tsx
- No major changes needed, just update styling if needed

### 6. MassHero.tsx
- Update subtitle text to: "Your all-in-one platform to build, market, and scale a business with live video and AI."
- Keep green gradient background

### 7. MassSearchBar.tsx
- Update placeholder to: "Search Yangu to buy, learn, create or sell..."

---

## Color Scheme

| Element | Color |
|---------|-------|
| Page background | Dark green gradient `#0a1f1a` → `#0f2922` |
| Sidebar | `#0f0f0f` (dark) |
| Hero gradient | `#1a3a2e` → `#0f2922` → `#0a1f1a` |
| Orange accent | `#f97316` |
| "Sale" category | Orange `#f97316` |
| "Learn" category | Teal/cyan `#14b8a6` |
| "Build" category | Blue `#3b82f6` |
| "Scale" category | Purple `#8b5cf6` |

---

## Technical Implementation Order

1. Update `MassLandingPage.tsx` - change background color
2. Update `MassSidebar.tsx` - add Start Selling CTA box
3. Update `resourceData.ts` - restructure to FEATURED, LEARN, BUILD, SCALE with new card data
4. Update `MassResourceCard.tsx` - add subtitle display and category color coding
5. Update `MassHero.tsx` - change subtitle text
6. Update `MassSearchBar.tsx` - change placeholder text
