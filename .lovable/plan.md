
# Remove Bottom Section from Landing ADA Page

## Change

Two small edits, both only affecting the landing page. Dashboard ADA is not touched.

### 1. `src/components/mass/ada/AdaMainPanel.tsx`
- Add an optional `hideBottomSection?: boolean` prop
- Wrap the `<AdaBottomSection />` render (line 2047) in a conditional: only render when `hideBottomSection` is not true

### 2. `src/components/mass/ada/LandingAdaPage.tsx`
- Pass `hideBottomSection` to `<AdaMainPanel hideBottomSection />` on line 34

Everything else stays exactly as-is -- all content sections (Understanding and Reason, Create with AI Tools, FAQ, etc.) remain on the landing page. Only the "ALL CHAT / IMAGES / icons" bottom panel is removed from the landing view.
