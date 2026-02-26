

## Plan: Add Image Lightbox Preview to Builder Media Picker

### What
Add a click-to-expand lightbox on the image thumbnail in `BuilderMediaPicker.tsx` so users can view the full image in a dialog before saving.

### Implementation

**File: `src/components/builder/BuilderMediaPicker.tsx`**

1. Import `Dialog`, `DialogContent`, `DialogTrigger` from `@/components/ui/dialog`
2. Import `Expand` icon from `lucide-react`
3. Replace the static `<img>` preview (lines 101-107) with a clickable thumbnail that opens a `Dialog` containing the full-size image:
   - Thumbnail gets a hover overlay with an expand icon and `cursor-pointer`
   - Dialog shows the image at full resolution with `object-contain` styling
   - Dialog includes the alt text below the image if present

```text
Before (line 101-107):
  <img src={value.url} alt="Preview" class="w-full h-24 object-cover rounded" />

After:
  <Dialog>
    <DialogTrigger asChild>
      <button class="relative group w-full cursor-pointer">
        <img ... class="w-full h-24 object-cover rounded" />
        <overlay with Expand icon on hover>
      </button>
    </DialogTrigger>
    <DialogContent class="max-w-3xl p-2">
      <img ... class="w-full max-h-[80vh] object-contain" />
    </DialogContent>
  </Dialog>
```

### Files Changed
- `src/components/builder/BuilderMediaPicker.tsx` — wrap preview image in Dialog lightbox

