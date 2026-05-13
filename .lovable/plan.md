# Yangu Offline — Phase 1 Plan

Parking (kept in code, no further work this phase): Speak-to-Build flow, Seller categories with page templates. Out of scope this phase: marketplace search across shops, public shop pages, write-from-web for shop owners.

This phase builds the **cloud half** of Yangu Offline. The desktop app lives outside Lovable; here we ship the database, sync APIs, and the web dashboards that talk to it.

## 1. Database schema (single migration)

Tables under `public`:

- `shops` — `id`, `owner_name`, `owner_phone`, `location`, `language`, `onboarded_by` (foot_soldier id), `status` (`active|blocked|pending`), `api_token_hash`, `last_seen_at`, `created_at`
- `catalogs` — `id`, `shop_id`, `name`, `description`, `price` (numeric), `stock_count`, `category`, `photo_url`, `language`, `sync_version` (bigint), `client_uuid` (for idempotency), `updated_at`
- `sales` — `id`, `shop_id`, `product_id` (nullable FK to catalogs), `amount`, `customer_phone`, `payment_method`, `client_uuid` (unique per shop, idempotency), `occurred_at`, `synced_at`
- `foot_soldiers` — `id` (= auth.users.id), `name`, `phone`, `region`, `bounty_balance` (numeric), `tier`, `joined_at`
- `bounty_payouts` — `id`, `foot_soldier_id`, `amount`, `method`, `status`, `created_at`
- `sync_log` — `id`, `shop_id`, `event_type`, `payload` (jsonb), `received_at`
- `bounty_rates` — `id`, `tier`, `rate_per_shop`, `rate_per_sale_pct`, `effective_from` (admin-tunable)
- `app_admins` — `user_id` PK (admin allow-list, separate from foot soldiers)

Indexes on `shop_id`, `(shop_id, client_uuid)` unique for idempotency, `occurred_at`, `received_at`.

**RLS**
- `shops`: foot soldier sees rows where `onboarded_by = auth.uid()`; shop owner sees rows where `owner_phone = auth.jwt().phone`; admins see all.
- `catalogs` / `sales` / `sync_log`: same shop-scoping via a `SECURITY DEFINER` helper `can_access_shop(shop_id)`.
- `foot_soldiers`: self-row read/update; admins all.
- `bounty_payouts`: foot soldier sees own; admins all.
- `bounty_rates`: read for authenticated; write admin-only.
- `app_admins`: admin-only.
- Helper: `is_app_admin(uid)` SECURITY DEFINER to avoid recursion.

Edge functions write with the service role and bypass RLS — RLS exists to protect dashboard reads.

## 2. Sync API (Edge Functions)

All functions: validate input with Zod, return CORS headers, write to `sync_log`, idempotent via `(shop_id, client_uuid)` unique constraint.

Auth model: per-shop API token issued at registration. Header `x-shop-token: <token>`. Functions hash and look up `shops.api_token_hash`. `verify_jwt = false` for these (device tokens, not user JWTs).

- `POST /sync-register` — body: `{ owner_name, owner_phone, location, language, foot_soldier_phone }`. Creates shop, returns `{ shop_id, api_token }` (token shown once).
- `POST /sync-catalog` — body: `{ items: [{ client_uuid, name, price, stock_count, ... , sync_version }] }`. Upsert by `(shop_id, client_uuid)`, last-write-wins on `sync_version`.
- `POST /sync-sales` — body: `{ sales: [{ client_uuid, product_id?, amount, customer_phone?, payment_method, occurred_at }] }`. Insert ignoring conflicts on `(shop_id, client_uuid)`.
- `GET /sync-pull?since=<iso>` — returns `{ catalogs: [...], cursor }` for catalog rows updated since cursor (sales are device-authoritative, no pull needed in V1).

Every call updates `shops.last_seen_at`.

## 3. Foot-soldier dashboard (web)

Route: `/offline/agent/*`. Phone OTP login (Supabase phone auth). Pages:

- **Shops list** — table of shops onboarded by this agent: name, phone, location, last-seen badge (green <24h, amber <7d, red older), catalog count, sales last 7d.
- **Shop detail** — header with owner info + status, tabs: Catalog (rows w/ price + stock), Recent sales (last 50), Sync activity (from `sync_log`).
- **Bounty** — current balance, tier, payout history, "Request payout" button (creates `bounty_payouts` row with status `requested`).
- **Add new shop** — manual fallback form; calls `sync-register` server-side, then shows generated API token + a printable card to hand to the owner.

## 4. Admin panel

Route: `/offline/admin/*`. Gated by `app_admins`. Pages:

- **Overview** — KPIs: total shops, active foot soldiers, sales last 7/30d, total bounty owed.
- **Shops** — searchable table, filters by status/region, row actions: block / unblock / view sync log.
- **Foot soldiers** — list + drill-down to their shops & payouts; mark payouts as paid.
- **Bounty config** — edit `bounty_rates` (tier table).
- **Sync activity** — recent `sync_log` entries with event type filter.

## 5. Shop-owner web view (read-only)

Route: `/offline/shop/*`. Phone OTP login; matches by `owner_phone`. Pages: catalog (read-only), sales (read-only), profile.

## Branding

Tailwind tokens added to `index.css` + `tailwind.config.ts`:
- `--offline-primary: 153 30% 12%` (#15261F dark green)
- `--offline-accent: 19 90% 56%` (#F46D2A orange)
- `--offline-bg: 43 25% 92%` (#F3F1EB cream)
- `font-sans` Inter via existing system font stack

Scoped to `/offline/*` routes only — does not touch the locked landing/auth/builder UI.

## File layout

```text
supabase/functions/
  sync-register/index.ts
  sync-catalog/index.ts
  sync-sales/index.ts
  sync-pull/index.ts
src/pages/offline/
  agent/{Login,Shops,ShopDetail,Bounty,AddShop}.tsx
  admin/{Overview,Shops,FootSoldiers,BountyConfig,SyncActivity}.tsx
  shop/{Login,Catalog,Sales,Profile}.tsx
src/components/offline/
  OfflineLayout.tsx, AgentNav.tsx, AdminNav.tsx, StatusBadge.tsx, ...
src/hooks/offline/
  useShops.ts, useShopDetail.ts, useBounty.ts, useSyncLog.ts, useAdminShops.ts, ...
src/lib/offline/
  shopToken.ts (client-side helpers), bountyMath.ts
```

Mounted in `src/App.tsx` under three new route groups; no changes to existing landing, builder, or auth routes.

## Build order

1. Migration (schema + RLS + helper functions + seed `bounty_rates`).
2. Edge functions + idempotency tests via `curl_edge_functions`.
3. Brand tokens + `OfflineLayout`.
4. Foot-soldier dashboard.
5. Admin panel.
6. Shop-owner read-only view.
7. Smoke-test end-to-end with a fake "device" curl script.

## Notes for the desktop app team (not built here)

- Auth: keep `x-shop-token` in OS keychain.
- Generate `client_uuid` per row (catalog item / sale) and persist it; safe to retry.
- Catalog uses last-write-wins on `sync_version`; bump it on every local edit.
- `GET /sync-pull?since=<cursor>` returns server's `updated_at` cursor to store locally.
