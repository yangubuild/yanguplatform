
# Fix Image Ads Pages to Stay Inside Dashboard Layout

## Problem
The `ImageAdsSelectProduct` overlay uses `fixed inset-0` which covers the entire viewport, hiding the dashboard navigation sidebar. This violates the Dashboard Layout Rule.

## Changes

### 1. `src/components/studio/image-ads/ImageAdsSelectProduct.tsx`
- Change the root container from `fixed inset-0 z-50` to `absolute inset-0 z-30` so it fills only the content panel, not the full viewport
- Change the footer from `absolute bottom-0 left-0 right-0` to `sticky bottom-0` for proper containment

### 2. `src/components/studio/image-ads/ImageAdsFlow.tsx`
- Add `relative` to the root container so the select-product overlay is positioned relative to the content panel, not the viewport
- Ensure the flow container uses `min-h-0 overflow-auto` for proper scroll containment within the dashboard shell
