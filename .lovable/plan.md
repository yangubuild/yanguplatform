
# Navigation Dashboard Page

## Overview
Create a new isolated marketing page at `/navigation` that replicates the BC.GAME reference layout exactly -- a dark sidebar with expandable navigation categories, a top header bar with search/deposit/icons, and a main content area featuring promotional banner cards in a horizontal carousel/grid.

## Page Structure (from the reference image)

### 1. Left Sidebar
- **App promo card** at top (dark card with "Application - Unlock Fun with Exclusive Features" + small image)
- **Token ticker** row (icon + "BC Token" + red percentage badge + price)
- **Nav items with chevron dropdowns:**
  - Casino (with icon + chevron)
  - Sports (with icon + chevron)
  - Lottery (with icon + chevron)
  - Crypto Futures (with icon + chevron)
  - Promotions (with icon + chevron)
- **Separator**
- **Bottom nav items (no chevron):**
  - VIP Club (with icon)
  - Bonus (with icon + green "+120%" badge)
  - Quest Hub (with icon)

Colors: Background `#1A1D26` (dark charcoal), text white/70, active items green-highlighted, badges in green/red.

### 2. Top Header Bar
- Hamburger menu icon (left)
- Logo "BC.GAME" (left)
- Right side: Search icon, currency selector ("AED 0.00" with dropdown), green "Deposit" button, gift icon, chat icon, bell icon, avatar circle

Colors: Background `#1A1D26`, Deposit button green `#27AE60`, currency badge dark with red icon.

### 3. Main Content Area
- Background: `#0E1116` (near-black)
- **3 promotional banner cards** in a horizontal row:
  - Card 1: "EXCLUSIVE" badge, "120% BONUS", "+ 100 FREE SPINS IN CASINO", "DEPOSIT NOW" button (dark outlined), casino wheel image (right side)
  - Card 2: "EXCLUSIVE" badge, "80% BONUS", "+ 5 FREE BET IN SPORTS", "DEPOSIT NOW" button, sports trophy/helmet image, green "Check >" button
  - Card 3: "EXCLUSIVE" badge, "DOUBLE THE SPINS", "BET $10 GET 20 FREE SPINS", "PLAY NOW" button, game artwork image
- Each card has a green-tinted gradient background
- Pagination dots below the cards

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/mass/navigation/NavigationDashboardPage.tsx` | Main page component with sidebar + header + content |
| `src/components/mass/navigation/NavDashSidebar.tsx` | Left sidebar with app card, token ticker, nav items |
| `src/components/mass/navigation/NavDashHeader.tsx` | Top header bar with search, deposit, icons |
| `src/components/mass/navigation/NavDashPromoCards.tsx` | Horizontal promotional banner cards |
| `src/components/mass/navigation/index.ts` | Barrel export |
| `src/pages/NavigationDashboard.tsx` | Route page wrapper |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route: `<Route path="/navigation" element={<NavigationDashboard />} />` |
| `src/components/mass/MassSidebar.tsx` | Add "Navigation" nav item linking to `/navigation` |

## Technical Details

### Color Palette (exact from reference)
- Page background: `#0E1116`
- Sidebar/header background: `#1A1D26`
- Card backgrounds: linear gradient with green tint (`#1B3D2E` to `#1A1D26`)
- Green accent: `#27AE60` (deposit button, active states)
- Red accent: `#E74C3C` (percentage badges)
- "EXCLUSIVE" badge: dark `#2A2D36` with white border
- Text primary: `#FFFFFF`
- Text secondary: `rgba(255,255,255,0.5)`
- Card border: `rgba(255,255,255,0.06)`

### Icons
All icons from `lucide-react`: `Search`, `ChevronDown`, `Gift`, `MessageSquare`, `Bell`, `Menu`, `Gamepad2`, `Trophy`, `Ticket`, `TrendingUp`, `Megaphone`, `Crown`, `Star`, `Compass`

### Layout
- Sidebar: fixed left, `w-[220px]`, full height
- Header: sticky top, full width minus sidebar
- Content: scrollable below header, `lg:ml-[220px]`
- Promo cards: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Cards: `rounded-xl`, `min-h-[180px]`, with right-side decorative images (placeholder colored circles since no real images)

### Patterns
- Follows the same isolated-page pattern as `/community`, `/ada-ai`, `/why-yangu`
- This page has its **own sidebar** (`NavDashSidebar`) distinct from `MassSidebar`, matching the BC.GAME reference exactly
- No auth, no platform logic, no backend -- purely static UI
- Mobile responsive with hamburger menu toggle for sidebar
