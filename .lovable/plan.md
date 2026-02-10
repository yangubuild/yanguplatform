

# Fix "List on Community" — PostgREST Schema Cache Issue

## Diagnosis

The frontend code is already correct. The 404 errors are NOT caused by missing code — they come from PostgREST not seeing `community_listings`, `list_on_community`, and `unlist_from_community` in its schema cache.

No frontend logic changes are needed. The RPCs are called correctly.

## What You Need To Do (on your side)

Run this SQL in the Supabase SQL Editor (not a migration — just a command):

```sql
NOTIFY pgrst, 'reload schema';
```

If that doesn't resolve the 404s, restart the PostgREST service from the Supabase dashboard (Settings > API > Reload).

## Frontend Change (small)

Add enhanced debug logging so you can see exactly what's happening after the schema reload:

1. **In `useCommunityListing.ts`** — Add a `console.warn` when the `community_listings` query returns a 404, so it's clear the issue is schema cache vs. a real missing table:

   - Log the full error object including `code` and `hint` fields
   - Silently return `null` instead of throwing (so the UI stays functional)

2. **In `SurfaceCard.tsx`** — Add a one-line debug log at the top of `attemptListOnCommunity` showing `VITE_SUPABASE_URL` so you can confirm the correct instance is being hit.

These are minor additions (under 5 lines total) to help you confirm when the schema cache reloads successfully.

## Expected Outcome After Schema Reload

- `POST /rpc/list_on_community` returns `200` with `{ success: true }` or a structured error
- `GET /community_listings?surface_id=eq.xxx` returns `200` with the listing row
- UI shows "Community" badge and "Unlist from Community" menu item

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useCommunityListing.ts` | Gracefully handle 404 in listing query (warn + return null) |
| `src/components/dashboard/SurfaceCard.tsx` | Log `VITE_SUPABASE_URL` at start of listing flow |

