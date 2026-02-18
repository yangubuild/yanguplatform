

## Tablet "View Trends" Overlap Fix

### Problem
On iPad/tablet (around 1024px width), the `lg:` Tailwind breakpoint activates. This causes:
- The sidebar to appear (via `lg:translate-x-0`)
- The main content to shift right (via `lg:ml-[240px]`)  
- The View Trends bar to pull left by 200px (via `lg:-ml-[200px]`)

At 1024px there is not enough space, so "View Trends" overlaps into the Explore button.

### Solution
Add a tablet-only override that reduces or removes the negative left margin on the trends bar. This uses a `md` range (768px-1023px has no sidebar so no issue) -- the real problem is at exactly `lg` (1024px+) on narrower screens like iPad.

The fix: change the negative margin and extra width from `lg:` to `xl:` (1280px+), and at the `lg:` breakpoint use a smaller offset that avoids overlap.

### File Change: `src/components/mass/MassTrendsBar.tsx`

**Line 24** -- Update the container className:

From:
```
lg:-ml-[200px] lg:pr-0 lg:w-[calc(100%+260px)]
```

To:
```
lg:-ml-[60px] lg:w-[calc(100%+120px)] xl:-ml-[200px] xl:w-[calc(100%+260px)]
```

This gives:
- **Mobile** (below 1024px): No negative margin (unchanged)
- **Tablet/small desktop** (1024px-1279px): Small 60px overlap -- enough to create the "emerging" effect without covering the Explore button
- **Desktop** (1280px+): Full 200px overlap as currently designed

No other files are modified. Desktop and mobile layouts remain identical.
