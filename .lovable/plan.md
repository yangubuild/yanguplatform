
# Add Image Ads Creation Flow to Studio

## Summary

When clicking the "Image Ads" tool chip on the Studio page, users enter a multi-step creation flow matching the reference screenshots. The flow is managed with local state (no new routes), using a step-based view within the Studio page.

## Flow Overview

**Step 1 -- Product Link Input** (Screenshot 1)
- Full-page view with "Image Ads" title top-left, Feedback + credits badge top-right
- Centered hero: "Share your **product link** to generate Image Ads"
- "Creatify supports:" label with 8 platform icons (Amazon, Shopify, Etsy, eBay, Alibaba, Google Play, WordPress, Webflow, "...")
- Large dark input: "e.g. amazon product link, shopify product link, app store link, etc." with "Try some link?" accent link
- Two bottom buttons side-by-side: "Choose existing product" (dark/border) and "Analyze URL" (purple/accent)
- Below: "You can also **add product manually**" link text

**Step 2 -- Choose Existing Product** (Screenshot 2, triggered by "Choose existing product" button)
- Full-screen dark overlay/modal: "Select a product" title
- Top-right: Search input + "+ New products" accent button
- Grid of product cards (thumbnail image + name + "X assets" count), selectable
- Bottom-right: "Cancel" and "Use this product" buttons

**Step 3 -- Manual Product Setup** (Screenshot 3-4, triggered by "add product manually" link)
- "Back" button top-left
- Card: "Set Up Your Image Ads" title, subtitle "Fill in product info and we'll generate the copy and visuals."
- Brand / Product name input
- Brand / Product description textarea
- "Select product images to start" section with "Choose the best 3-5 product images..." help text + "Tips" badge
- Red-dashed border upload area with "+ Add assets" placeholder
- "Select all", "Unselect all", "Delete select" chip buttons
- Red validation text: "Please choose at least one image to proceed."
- Collapsible "Advanced settings (Optional)" section with chevron
- "Promotional info" toggle section

**Bottom Toolbar** (Screenshots 4-6, sticky at page bottom)
- Three dropdowns: Model (Design Pro / Design Master [NEW] / Nano Banana), Orientation (Square / Landscape / Portrait), Count (4 / 10 / 20 images)
- "Generate" accent button (red/purple)

## Technical Plan

### New Files

1. **`src/components/studio/image-ads/ImageAdsFlow.tsx`** -- Main orchestrator component with state machine (step: "link" | "select-product" | "manual-setup")
2. **`src/components/studio/image-ads/ImageAdsLinkStep.tsx`** -- Step 1: product link input page
3. **`src/components/studio/image-ads/ImageAdsSelectProduct.tsx`** -- Step 2: product selection modal/overlay
4. **`src/components/studio/image-ads/ImageAdsManualSetup.tsx`** -- Step 3: manual product form
5. **`src/components/studio/image-ads/ImageAdsBottomBar.tsx`** -- Sticky bottom toolbar with model/orientation/count dropdowns + Generate button

### Modified Files

1. **`src/App.tsx`** -- Add child route `/studio/image-ads` under the `/studio` route
2. **`src/pages/Studio.tsx`** -- Wire the "Image Ads" tool chip to navigate to `/studio/image-ads`

### Routing

```
/studio              -> Studio main page (existing)
/studio/image-ads    -> ImageAdsFlow (new)
```

The `/studio` route already wraps in `NavigationDashboardPage`, so adding a child route gives us the dashboard shell automatically.

### Component Details

**ImageAdsLinkStep** (Step 1):
- State: `productUrl` string
- Platform icons rendered as styled divs with brand initials (no external images needed)
- "Analyze URL" validates URL is non-empty, then would call generation (placeholder for now)
- "Choose existing product" sets step to "select-product"
- "add product manually" sets step to "manual-setup"

**ImageAdsSelectProduct** (Step 2):
- Rendered as a full-screen overlay (fixed position, dark bg)
- Mock product grid (placeholder data -- "ada ai", "2 assets")
- Search input filters products by name
- "Cancel" returns to step "link", "Use this product" proceeds (placeholder)
- "+ New products" button (placeholder action)

**ImageAdsManualSetup** (Step 3):
- "Back" button returns to step "link"
- Form fields: brand name (Input), description (Textarea)
- Image upload area with dashed red border, "+ Add assets" placeholder
- "Select all / Unselect all / Delete select" action chips
- Validation message in red
- Collapsible "Advanced settings" using Collapsible component
- "Promotional info" with Switch toggle

**ImageAdsBottomBar** (shared across steps 1 and 3):
- Sticky `fixed bottom-0` bar
- Three Select dropdowns:
  - Model: Design Pro, Design Master (with NEW badge), Nano Banana
  - Orientation: Square, Landscape, Portrait (with icons)
  - Count: 4 images, 10 images, 20 images
- Purple "Generate" button on the right
- Dark glass background with border-top

### No Database Changes

This is purely a UI/frontend feature. No new tables, RLS policies, or edge functions needed. The "Generate" button will be a placeholder that shows a toast for now.
