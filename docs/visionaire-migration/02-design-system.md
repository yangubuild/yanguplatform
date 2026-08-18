# Visionaire — Exact Design System (F)

All values extracted from `src/index.css`, `tailwind.config.ts`, `src/lib/typography.ts` and the Visionaire component files. HEX values are exact conversions of the HSL tokens — nothing estimated.

Important correction to the brief: there is **no "primary green" or "hover green"**. Visionaire inherits the Yangu dark theme: near-black deep-green surfaces with a **burnt orange** accent (`hsl(25 85% 45%)` / `#D46211`). Sidebar selection uses an elevated dark surface, not green.

## Colors — dark theme (the theme Visionaire ships in)

| Role | Token | HSL | HEX |
| --- | --- | --- | --- |
| Main background | `--background` | 150 20% 5% | `#0A0F0D` |
| Card / popover / dropdown surface | `--card`, `--popover` | 150 15% 8% | `#111714` |
| Elevated surface | `--surface-elevated` | 150 14% 11% | `#18201C` |
| Sunken surface | `--surface-sunken` | 150 20% 4% | `#080C0A` |
| Borders + input borders | `--border`, `--input` | 150 12% 15% | `#222B26` |
| Focus ring | `--ring` | 150 12% 25% | `#384740` |
| Accent (buttons, active icons, `text-accent` bookmark) | `--accent` | 25 85% 45% | `#D46211` |
| Accent foreground | `--accent-foreground` | 0 0% 100% | `#FFFFFF` |
| Primary text | `--foreground` | 150 10% 95% | `#F1F4F2` |
| Secondary / muted text | `--muted-foreground` | 150 10% 60% | `#8FA399` |
| Muted / secondary fill (badge `secondary`, skeletons) | `--muted`, `--secondary` | 150 12% 15% | `#222B26` |
| Success | `--success` | 160 84% 45% | `#12D393` |
| Warning | `--warning` | 38 92% 55% | `#F6A823` |
| Destructive | `--destructive` | 0 72% 51% | `#DC2828` |

### Sidebar

| Role | Token | HSL | HEX |
| --- | --- | --- | --- |
| Sidebar background | `--sidebar-background` | 150 20% 5% | `#0A0F0D` |
| Sidebar text | `--sidebar-foreground` | 150 10% 92% | `#E9EDEB` |
| Sidebar active/brand | `--sidebar-primary` | 25 85% 45% | `#D46211` |
| Selected nav background | `--sidebar-accent` | 150 14% 11% | `#18201C` |
| Sidebar border | `--sidebar-border` | 150 12% 15% | `#222B26` |

### Light theme (fallback, rarely used)

`--background` `#F9FAFB` · `--foreground` `#0F1729` · `--card` `#FFFFFF` · `--muted` `#F1F5F9` · `--muted-foreground` `#65758B` · `--accent` `#3C83F6` · `--border`/`--input` `#E1E7EF`.

### Gradients & shadows (dark)

- `--gradient-primary`: `linear-gradient(135deg, #D46211 0%, #863913 100%)`
- `--gradient-hero`: `linear-gradient(180deg, #0A0F0D 0%, #111714 100%)`
- `--gradient-glow`: `radial-gradient(ellipse at center, hsl(25 85% 45% / 0.2) 0%, transparent 70%)`
- Bundles cards use a **runtime deterministic gradient** hashed from the title: `linear-gradient(135deg, hsl(h1,55%,25%), hsl(h2,45%,15%))` (`titleToGradient()` in `VisionaireBundles.tsx`) — reproduce this function verbatim.
- `--shadow-sm` `0 1px 2px 0 hsl(0 0% 0% / .3)` · `--shadow-md` `0 4px 6px -1px hsl(0 0% 0% / .4), 0 2px 4px -2px hsl(0 0% 0% / .3)` · `--shadow-lg` `0 10px 15px -3px hsl(0 0% 0% / .5), 0 4px 6px -4px hsl(0 0% 0% / .4)` · `--shadow-xl` `0 20px 25px -5px hsl(0 0% 0% / .6), 0 8px 10px -6px hsl(0 0% 0% / .5)` · `--shadow-glow` `0 0 60px hsl(24 95% 53% / .3)`

## Typography

- Font family: **Lufga**, self-hosted OTF from `/public/fonts/Lufga-*.otf`, weights 100–900 with italics, `font-display: swap`. Fallback `system-ui, sans-serif`. Mono: `JetBrains Mono`. Tailwind `font-sans` and `font-display` both map to Lufga.
- Global tokens (`src/lib/typography.ts`): hero `text-[36px] md:text-[42px] font-semibold leading-[1.1] tracking-tight` · header `text-[24px] md:text-[36px] font-bold leading-[1.2]` · body/subheader `text-sm leading-relaxed` · bodyCompact `text-xs leading-relaxed` · cardTitle `text-base font-semibold` · sectionH2 `text-xl font-bold`.
- Actual Visionaire usage:
  - Library hero H1: `text-2xl sm:text-3xl font-bold text-foreground`
  - Bundles hero H1: `text-2xl md:text-3xl font-bold`
  - Sub-page H1 (Deals, Covers, Mockups): `text-xl font-bold text-foreground`
  - Page subtitle: `text-sm text-muted-foreground mt-1` / `mt-2`
  - Card title: `text-sm font-semibold line-clamp-2 leading-tight min-h-[2.5rem]`
  - Card description: `text-xs text-muted-foreground line-clamp-2`
  - Format badge: `text-[10px]` (`Badge variant="secondary"`)
  - Buttons in cards: `h-8 text-xs`; filter selects `h-9 text-xs`; search input `h-11 rounded-full` (library) / default `pl-9` (sub-pages)
  - No custom letter-spacing except `tracking-tight` on the hero token.

## UI system

- Radius: `--radius: 0.5rem` → `rounded-lg` = 8px, `rounded-md` = 6px, `rounded-sm` = 4px, `rounded-xl` = 12px, `rounded-2xl` = 16px, `rounded-3xl` = 24px. Cards use `rounded-xl`. Search pill on the library page uses `rounded-full`; project rule elsewhere is no oval shapes.
- Content width: `max-w-[1200px] mx-auto`, gutters `px-3 sm:px-4 lg:px-6`, vertical `pt-4 sm:pt-6 pb-8 sm:pb-10`, `min-h-screen`, `overflow-x-hidden` (`VisionairePageContainer`).
- Section rhythm: `space-y-6` (most pages), `space-y-8` (Bundles).
- Grids:
  - Library / item grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6`
  - Bundles: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Book covers: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5`, tile ratio `aspect-[3/4]`
  - Special Deals: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
  - Mockups: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`, image `aspect-[4/3] object-cover`
- Card anatomy (`VisionaireItemCard`): `rounded-xl border border-border bg-card overflow-hidden` → thumbnail `aspect-video bg-muted object-contain` (first 8 cards `loading="eager"`, rest lazy) → body `p-4 space-y-2` → action row `flex items-center gap-1.5 pt-2 mt-auto`.
- Hover / transitions: cards `transition-all hover:shadow-lg hover:-translate-y-0.5`; mockup images `transition-transform duration-300 group-hover:scale-105`; tags `hover:bg-accent/50 transition-colors`; icon buttons use shadcn `ghost`/`outline` variants.
- Loading: skeletons are `animate-pulse` blocks matching card geometry (6 placeholders).
- Animations available from Tailwind config: `accordion-down/up`, `slide-up`, `slide-down`, `fade-in`, `scale-in`, `float`, `shimmer`.
- Icon library: **lucide-react** only. Icons seen: Search, SlidersHorizontal, Clock, Bookmark, BookmarkCheck, Download, Play, Headphones, FileText, Package, Tag, ExternalLink, Sparkles, TrendingUp, GraduationCap, Users, MessageSquare, ChevronUp/Down, Upload, Loader2, ArrowLeft/Right, HardDrive, CheckCircle2, Circle, BookOpen, BarChart3, Crown, Layers, Image, Lightbulb, Zap, Sparkle, Send, PenLine.
- Component library: shadcn/ui (Button, Input, Badge, Select, Dialog, Textarea, Label), toasts via **sonner**, data via **@tanstack/react-query**, routing via **react-router-dom**.
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1400 for container). Mobile target 360–414px: 1-column grids, smaller gaps (`gap-3`), icon buttons shrink to `h-7 w-7`.
