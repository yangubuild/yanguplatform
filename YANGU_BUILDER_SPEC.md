# YANGU BUILDER SPECIFICATION — PERMANENT REFERENCE

Version: 1.0 | Status: Active | Classification: Internal

If implementation conflicts with this specification, the specification
takes precedence.

## Builder Types and Surface Types

| Builder     | surface_type      | publishDomain              |
|-------------|-------------------|----------------------------|
| Eshop       | eshop             | yangu.shop                 |
| Emenu       | emenu             | restaurant.yangu.shop      |
| Esite       | quick_site        | yangu.site                 |
| Estore      | store_listing     | yangu.store                |
| Influencer  | live_bio          | yangu.live                 |
| Community   | community_group   | yangu.community            |

## Builder Protection Rules (MANDATORY — never violate)

Rule 1:  Builder Type determines Features.
Rule 2:  Features determine Editor Modules.
Rule 3:  Editor Modules determine Templates.
Rule 4:  Templates never determine Builder Logic.
Rule 5:  Eshop may never load Emenu modules.
Rule 6:  Emenu may never load Eshop inventory modules.
Rule 7:  Community may never load Influencer modules.
Rule 8:  Influencer may never load Community modules.
Rule 9:  Builder type is locked after surface creation.
Rule 10: ADA routing must occur before template generation.
Rule 11: Every builder must support mobile-first rendering.
Rule 12: No sellable item may be published without
         Button + Cart Connection + Checkout Connection.

## Editor Routing (BuilderEditorRouter.tsx)

eshop / store_listing / quick_site → SellerEditor
emenu                              → EmenuNewEditor
live_bio                           → InfluencerEditorPlaceholder
community_group                    → CommunityEditorPlaceholder

## Approved Templates Per Builder

Eshop:               existing YANGU templates (protect, expand only)
Emenu:               existing YANGU templates (protect, expand only)
Estore:              estore_minna, Monchies, Bazaro, Fashion V3
Esite Consultancy:   ShieldPro, Interim, Loom, Maison
Esite Real Estate:   Realisting, Top Listings
Esite Hotels:        Luxra, Telvin
Esite Travel:        Tripset, Key Assumptions
Esite Construction:  Estatoo
Influencer:          BioBurst, LinkNest, LinkHunt, Teespring, Creator Bio
Community Events:    EventVerse, WanderSolo, Padelix
Community Courses:   BrightMind, GearUp
Community Freelance: Frederick, Porty, Portfon, Porta, LinkNest

## ADA Qualification Questions (ALL required before routing)

1. Business Name
2. Business Category
3. Country
4. Location (city)
5. Color Preferences
6. Logo
7. Products or Services (structured, not free-text blob)
8. Payment Methods
9. Where do you plan to sell most?
   Options: Website / Social Media / WhatsApp / Combination

## ADA Routing Rules

Retail                            → Eshop
Restaurant / Food / Cafe          → Emenu
Supplier / Wholesale / Bulk       → Estore
Service Business / Consultancy    → Esite
Creator / Social Seller /
  Influencer / Social Media first → Influencer Builder
Community / Church / Club /
  Coach / Educator / NGO          → Community Builder

## Template Selection Rule

ADA must generate exactly 3 template variations.
User must select one variation before the editor opens.
The editor must never open before template selection.

## Surface Lifecycle

Draft → Builder Editing → Dashboard/My Business →
Publish → Live Surface → Discovery Eligible

## Discovery Rules

- Live entities always outrank placeholders.
- Placeholders fill empty slots only — never displace live entities.
- A surface without a cover image is not discovery eligible.
- Published status alone does not mean discovery eligible.

## Dashboard Rules

- Route: /dashboard/home (primary dashboard entry)
- Every surface appears in My Business immediately after creation.
- Publishing is not required to appear in My Business.
- Drafts appear with status: "draft".

## Implementation Rule

No change to any builder, editor, template, routing, or publishing
file may be made without first reading this file.

## Surface Suspension Model

Surface suspension is modeled through `builder_publishes.state` via the
`manage_surface_action` RPC (has_role admin check).
`builder_surfaces.status` tracks owner-controlled lifecycle
(draft / published / archived) only and is never set to `suspended`
by admin actions.