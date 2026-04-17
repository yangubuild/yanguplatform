
User clarification: For now, ALL categories (eshop, esite, estore, influencer, community) should use the EXACT same emenu editor chrome — top nav bar, page top editor, publish modal, and editor page layout. Influencer/community may diverge later, but not now.

Last turn I already routed all categories through `EmenuNewEditor` in `BuilderEditorRouter.tsx` and removed the emenu-only gate in `BuilderNewPage.tsx`. So the unification should already be in place. The user is confirming the direction — they want me to acknowledge that the fix means: pick any variant in any category → land in identical emenu editor chrome, and that's correct intent.

No new code changes required from this message — it's a confirmation/clarification. I'll restate the plan briefly so the user can approve and we move on.

## Plan

**Confirm current unified routing is correct, no further changes needed right now**

1. `BuilderEditorRouter.tsx` already returns `EmenuNewEditor` for every `surface_type` (eshop, store_listing, quick_site, live_bio, community_group, emenu) — so all categories share the emenu editor shell.
2. `BuilderNewPage.tsx` `handleChooseVariant` already initializes a real surface for every category and navigates into that unified editor (gate removed).
3. Result: picking any eshop / esite / estore / influencer / community variant lands in the exact emenu editor chrome — same top nav bar, same page-top edit bar, same publish modal, same full-screen layout (no dashboard sidebar).
4. Influencer & community keep this same chrome for now; we revisit when those categories get their own specs.

**Verification after approval**
- Click a variant in each category and confirm:
  - Top nav bar identical to emenu (Dashboard back, business name, Desktop/Mobile, Ada toggle, Settings, Publish).
  - Page-top edit bar identical.
  - Publish button opens the full emenu publish modal (Page Title, SEO Description, Favicon, Cover Image, domain slug, Cancel/Publish).
  - No dashboard sidebar visible — full-screen editor.

Nothing else to change in code. Approve and I'll switch to default mode only if verification surfaces a gap.
