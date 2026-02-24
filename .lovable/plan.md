

## Analysis of the Original "Sign in" Button

Looking at the reference screenshot carefully, the "Sign in" button is:
- A **dark forest green** with a slight rounded pill shape
- Distinctly greener and darker than the current `--secondary` token (`hsl(150 12% 15%)` = ~`#212B26`)
- Matches `#152A20` — the same color already used in `CommunityPage.tsx`

The current `variant="secondary"` resolves to `hsl(150, 12%, 15%)` which is too gray/light compared to the original. The fix is to override the background with the exact original color.

## Plan

**File: `src/components/mass/MassHeader.tsx`** (single change)

Add a className override to the "Sign in" button to force `#152A20` background with a slightly lighter hover state:

```tsx
<Button
  variant="secondary"
  size="sm"
  className="[background:#152A20] hover:[background:#1a3327] border-0"
  onClick={() => navigate("/auth/login")}
>
  Sign in
</Button>
```

This matches the exact dark forest green from the original screenshot and is consistent with how `CommunityPage.tsx` already implements this same color. No other files change. Desktop layout untouched.

