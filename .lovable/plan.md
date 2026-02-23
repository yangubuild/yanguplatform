

## Fix: Revert Card Images Back to `object-cover`

**Problem**: The change to `object-contain` introduced visible dark background gaps around the images. The original cards filled their containers completely edge-to-edge with `object-cover`, and the new yangu app images should do the same — they already have their own built-in backgrounds (green, orange, yellow, etc.) that naturally fill the frame.

**Solution**: Revert the `<img>` class in `MassResourceCard.tsx` back to `object-cover`, removing `object-contain object-center`.

---

### Technical Details

**File**: `src/components/mass/MassResourceCard.tsx` (line 28)

**Change**:
- From: `object-contain object-center`
- To: `object-cover`

This restores:
- Images filling the entire container with no background gaps
- Rounded corners from the parent container clipping the image naturally
- Identical visual behavior to the original Gramerz/Jobhunt/etc. cards
