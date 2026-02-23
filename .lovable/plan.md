

## Fix: Card Images Getting Cut Off in Explore Grid

**Problem**: The new yangu app card images (eshop, ada ai, etc.) contain UI screenshots and logos that get visually cropped when displayed with `object-cover`. The previous cards (Gramerz, Jobhunt, etc.) were full-bleed photos that worked fine with cover mode, but these new images need to display their full content.

**Solution**: Change the image fitting for featured/yangu app cards from `object-cover` to `object-contain` with `object-center`, so the entire image is visible within the card frame without cropping.

---

### Technical Details

**File**: `src/components/mass/MassResourceCard.tsx`

**Change**: On the `<img>` element (line 28), update the CSS classes:
- From: `object-cover`
- To: `object-contain object-center`

This single change ensures:
- The full image is always visible (no cropping of text/logos/UI)
- Images are centered within the 4:3 aspect ratio container
- The dark background (`#0A1710`) fills any letterbox/pillarbox space naturally
- No changes to layout, spacing, hover effects, or any other styling
