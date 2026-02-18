
## Fix Ada AI Layout: Content Centering + Sidebar Text Alignment

### Problem 1: Main content not centered in the right panel
The Ada content (title, mode switcher, chat box, actions) appears shifted to the right. The space between the chat history panel's right edge and the content is much larger than the space between the content and the page's right edge. This happens because the content uses `max-w-2xl` (672px) centered inside a very wide flex container, but the top-bar Extensions button sits at the far right, creating a visual imbalance.

**Fix:** Remove `px-4` and instead use `mx-auto` with a tighter `max-w-3xl` container that accounts for the available width properly. The key change is to make the outer wrapper NOT center with `items-center` but instead use a nested centered container that respects the actual available space. Specifically, reduce the right padding and increase left padding so the content visually sits closer to the history panel.

Concretely in `AdaMainPanel.tsx` (line 1598):
- Change from `px-4` to `pl-4 pr-8` -- NO, the real fix is to shift the `max-w-2xl` content blocks to the LEFT using `mr-auto` + some left margin, rather than centering them.

Actually, the simplest correct fix: change the container from `items-center` to `items-start` and add appropriate left padding (~`pl-8` or `pl-12`) so the content sits closer to the history panel, with more space on the right. This matches what the user's red marks show -- they want the content moved LEFT.

### Problem 2: "ALL CHAT" not aligned with "+ New Chat"
In the sidebar, "+ New Chat" has `px-4` on its container plus `px-1` on the button itself (total ~20px left). "ALL CHAT" is inside a `px-4` container with no extra padding. The text should start at the same horizontal position.

**Fix:** In `AdaSidebar.tsx`, add `px-1` to the "All chat" paragraph to match the "+ New Chat" button's inner padding.

---

### Technical Changes

**File: `src/components/mass/ada/AdaMainPanel.tsx`**
- Line 1598: Change the center content container from `items-center justify-center px-4` to `items-start justify-center pl-12 pr-4` so the content block shifts left toward the history panel, leaving more space on the right side.
- All inner `max-w-2xl` blocks remain unchanged -- they'll just be left-aligned within the container instead of centered.

**File: `src/components/mass/ada/AdaSidebar.tsx`**  
- Line 252: Add `px-1` class to the "All chat" text paragraph so it aligns horizontally with the "+ New Chat" button text above it.

### No other changes
- Dashboard sidebar: untouched
- Landing page: untouched
- Studio page: untouched
- No component redesign
