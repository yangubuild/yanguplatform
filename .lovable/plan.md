

## Fix: Restore Card Images to Original Full-Size Display

**Problem**: The current code forces images into a fixed `aspect-[16/10]` container with `object-contain`, which shrinks images and creates background gaps. The original design lets each image dictate its own natural height while filling the full container width, with rounded corners applied by the parent wrapper.

**Solution**: Remove the fixed aspect ratio and object-fit constraints. Use `w-full block` on the image so it fills the container width at its natural proportions. The `overflow-hidden rounded-2xl` on the wrapper handles the curved corners.

---

### Technical Details

**File**: `src/components/mass/MassResourceCard.tsx`

**Changes**:

1. **Container div (line 19)**: Remove `aspect-[16/10]` — keep `relative overflow-hidden rounded-2xl mb-3`
2. **Image element (line 21-24)**: Change classes from `w-full h-full object-contain` to `w-full block` — no object-fit, no fixed height

**Result**:
- Images fill the full width of the card with no cropping
- Each image displays at its natural aspect ratio (all source images are the same ratio, so they align)
- Rounded corners are applied via the parent's `overflow-hidden rounded-2xl`
- No background gaps, no stretching, no shrinking
- Hover scale effect preserved

