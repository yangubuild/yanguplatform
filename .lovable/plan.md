## Scope

Rebuild ONLY the Estore and Esite Chat-to-Build flows in the New Builder. Do not touch Eshop, Emenu, Influencer, Community, publishing, routing, editor layout, product cards, WhatsApp, or currency.

## Files to change

1. `src/components/builder-new/hooks/useStepController.ts` — replace Estore/Esite step machine
2. `src/pages/BuilderNewPage.tsx` — greet with category-specific first question; route free-text for new steps; pass category to logo
3. `src/components/builder-new/ChatInterface.tsx` — input enabled / placeholders for the new free-text steps
4. `src/pages/dashboard/SellerSurfacePage.tsx` — verify `initialCategory={engineKey}` (already correct in `SELLER_KEY_MAP`); persist new Estore/Esite metadata fields on completion

No changes to `templateRegistry.ts` (already approved), `generate-logo` edge function (already enforces category symbol policy), or any other surface.

## Estore step machine (replace existing)

Delete: `estore_payment_condition`.

Add new `BuilderStep` IDs:
- `estore_business_name` (free text — "What's your company name?")
- `estore_mobile_money_number` (free text — conditional)
- `estore_bank_account_name` (free text — conditional)
- `estore_has_logo` (yes/no cards)
- `estore_wants_ai_logo` (yes/no cards)

Rewire `WHOLESALE_PAYMENT_OPTIONS` to exactly: Bank transfer, Mobile money, Letter of credit.

Keep existing IDs and reorder via `getNextStep`:

```
greeting → estore_business_name
estore_business_name → estore_business_model
estore_business_model → estore_supply_type       (industry)
estore_supply_type    → estore_product_volume
estore_product_volume → estore_moq
estore_moq            → estore_moq_value (if yes) | estore_payment_methods
estore_moq_value      → estore_payment_methods
estore_payment_methods (multi, Done) → conditional fan-out:
   if mobile_money selected → estore_mobile_money_number
   else if bank_transfer    → estore_bank_account_name
   else                     → estore_quote_requests
estore_mobile_money_number → (if bank_transfer also picked) estore_bank_account_name
                              else                            estore_quote_requests
estore_bank_account_name   → estore_quote_requests
estore_quote_requests      → estore_location
estore_location            → estore_has_logo
estore_has_logo (yes)      → template_choice
estore_has_logo (no)       → estore_wants_ai_logo
estore_wants_ai_logo (yes) → ai_logo → template_choice
estore_wants_ai_logo (no)  → template_choice
template_choice            → confirmation → generation
```

State stored on `estoreConfig`: add `mobileMoneyNumber`, `bankAccountName`, `hasLogo`, `wantsAiLogo`. Remove `paymentCondition`.

## Esite step machine (replace existing)

Delete: `esite_payment_condition`.

Add new `BuilderStep` IDs:
- `esite_business_name`
- `esite_mobile_money_number`
- `esite_payment_email`
- `esite_has_logo`
- `esite_wants_ai_logo`

Rewire `SERVICES_PAYMENT_OPTIONS` to exactly: Bank transfer, Mobile money, Cards.

Order:

```
greeting → esite_business_name
esite_business_name → esite_service_type
esite_service_type  → esite_key_services
esite_key_services  → esite_booking
esite_booking (yes) → esite_booking_email → esite_payment_methods
esite_booking (no)  → esite_payment_methods
esite_payment_methods (multi, Done) → conditional fan-out:
   if mobile_money → esite_mobile_money_number
   else if cards   → esite_payment_email
   else            → esite_location
esite_mobile_money_number → (if cards also picked) esite_payment_email
                             else                   esite_location
esite_payment_email → esite_location
esite_location      → esite_has_logo
esite_has_logo (yes)        → template_choice
esite_has_logo (no)         → esite_wants_ai_logo
esite_wants_ai_logo (yes)   → ai_logo → template_choice
esite_wants_ai_logo (no)    → template_choice
template_choice → confirmation → generation
```

State on `esiteConfig`: add `mobileMoneyNumber`, `paymentEmail`, `hasLogo`, `wantsAiLogo`. Remove `paymentCondition`.

## Greeting override (kill the generic flow for Estore/Esite)

In `useStepController.getStepConfig`, when `lockedCategory === "estore"`, the `greeting` step renders:

> "What's your company name?"

`allowFreeText: true`, `renderAs: "location_input"`.

For `lockedCategory === "esite"`, the same step renders:

> "What's your business name?"

`handleGreetingInput` (for these two categories) stores the text into `businessName` and routes to `estore_business_name → estore_business_model` (or `esite_business_name → esite_service_type`). The existing generic greeting (which infers category and pushes through `country → products_services → payment_methods → sell_channel → shop_type`) is bypassed entirely when `lockedCategory` is `estore` or `esite`.

Also: `handleOptionSelect` `sell_channel` branch and any other path that could land an Estore/Esite session on Eshop steps is hard-guarded — when `lockedCategory` is estore/esite, those branches throw via `assertCategoryLocked` from `categoryRegistry.ts`.

## Free-text + input enablement

- `inputAllowed` in `useStepController`: add `estore_business_name`, `esite_business_name`, `estore_mobile_money_number`, `estore_bank_account_name`, `esite_mobile_money_number`, `esite_payment_email`.
- `BuilderNewPage.handleFreeText`: same step list routes to `handleQualificationInput`.
- `handleQualificationInput`: new cases persist each value into `estoreConfig`/`esiteConfig` and advance per the fan-out rules above.
- `ChatInterface` placeholders: short hints (e.g. "07XX XXX XXX", "Bank account name", "bookings@yourdomain.com").

## Templates (no registry change)

`template_choice` already routes Estore to `getEstoreTemplateOptions()` (Minna, Monchies, Bazaro Fashion, Bazaro Classic) and Esite to `getEsiteTemplateOptions(serviceType)` (ShieldPro, Interim, Realisting, Toplistings, Luxra, Telvin, Tripset, Key Assumptions, Estatoo). Verified — no edit needed.

## Logo generation

`ai_logo` step already reads `getAiLogoContext(menuClassification, category)`; for Estore it returns `{category:"estore", businessType:"retail"}` and for Esite `{category:"esite", businessType:"services"}`. The `generate-logo` edge function already blocks food/restaurant symbols for non-Emenu categories. Pass `wants_ai_logo === "yes"` as the gate before entering `ai_logo`.

## Metadata persistence

`SellerSurfacePage.handleComplete` already forwards `answers` to seed metadata. Append the new Estore/Esite fields under `metadata.business` and `metadata.estore` / `metadata.esite`:

```
estore: { business_model, industry, product_volume, has_moq, moq_value,
          payment_methods, mobile_money_number, bank_account_name,
          enable_quotes, has_logo, wants_ai_logo, design_template }
esite:  { industry, services_offered, has_booking, booking_email,
          payment_methods, mobile_money_number, payment_email,
          has_logo, wants_ai_logo, design_template }
```

`BuilderNewPage.handleGenerate` builds the answers payload passed downstream (already does this for `country`, `payment_methods`, etc.) — extend it to include the new fields read from `ctrl.estoreConfig` / `ctrl.esiteConfig`.

## Confirm category lock at route entry

Re-read `SellerSurfacePage.tsx`: `engineKey = SELLER_KEY_MAP[sellerKey]` and `<BuilderNewPage embedded initialCategory={engineKey} ... />` — this already passes `"estore"` for `/seller/estore` and `"esite"` for `/seller/esite`. `BuilderNewPage` resolves `lockedCategory` from `initialCategory ?? urlCategory`, and `useStepController` seeds `category` from `lockedCategory` on first render. No `null` window remains. Plan does not change this wiring — but the rebuilt `getStepConfig` for `greeting` will read `lockedCategory` directly (not the deferred state) so the first message is always the category-specific business-name prompt, never the generic greeting.

## Validation (manual, before sign-off)

I will navigate the live preview and confirm each of the 15 points by capturing the visible chat text:

1. `/dashboard/seller/estore?mode=ai` first message = "What's your company name?"
2. Estore step 2 cards = Wholesale / Trading / Both
3. Estore payment chips = Bank transfer / Mobile money / Letter of credit
4. Selecting Mobile money → next prompt "What's your business mobile money number?"
5. Selecting Bank transfer → next prompt "What's your bank account name?"
6. Estore template carousel = Minna, Monchies, Bazaro Fashion, Bazaro Classic
7. Estore never shows shop_type / Eshop templates / 5 style cards
8. `/dashboard/seller/esite?mode=ai` first message = "What's your business name?"
9. Esite asks "What type of services do you offer?" with 8 cards
10. Esite asks "What are your key services?"
11. Booking = Yes → "What email should booking confirmations go to?"
12. Mobile money selected → "What's your mobile money number?"
13. Cards selected → "What's your email for Stripe/PayPal setup?"
14. Esite template carousel = ShieldPro, Interim, Realisting, Toplistings, Luxra, Telvin, Tripset, Key Assumptions, Estatoo
15. Esite never shows shop_type / Eshop templates / style cards

I will paste the exact UI text (or screenshots) for each item in the closing report and only then mark complete.
