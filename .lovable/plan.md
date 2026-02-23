

## Fix: Full-Width Background Color and Proper Trends-to-Hero Spacing

### Issue 1: Background color only covers inner content, not the full container

**Root cause**: In `DashboardExplore.tsx`, the `#08120D` background is applied to the same div that has `max-w-[1100px] mx-auto`, so it only paints the centered column. The outer dashboard shell shows its own gradient (`#1f262b`) on either side.

**Fix**: Split into two divs -- an outer full-width div with the background color, and an inner centered div for padding/max-width.

### Issue 2: Trends bar sitting too close to / overlapping the hero

**Root cause**: `MassTrendsBar` uses negative margins (`lg:-ml-[60px]`, `xl:-ml-[200px]`) and `mt-6` which work on the landing page but cause layout issues inside the constrained dashboard content area. The `mt-10` on the hero wrapper in `ExploreLandingContent` doesn't match the landing page spacing either.

**Fix**: Change `mt-10` back to `mt-8` on the hero wrapper to match the landing page's visual spacing. The trends bar negative margins will naturally extend into the full-width background now.

---

### Technical Details

**File 1: `src/pages/dashboard/DashboardExplore.tsx`**

Wrap with a full-width outer div that carries the background, keep the inner div for centering:

```tsx
export default function DashboardExplore() {
  return (
    <div className="min-h-full" style={{ background: '#08120D' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto">
        <ExploreLandingContent />
      </div>
    </div>
  );
}
```

**File 2: `src/components/mass/ExploreLandingContent.tsx`**

Change `mt-10` to `mt-8` on the hero wrapper to better match the landing page spacing (the trends bar already has its own `mt-6`):

```tsx
<div className="mt-8">
  <MassHero />
</div>
```

