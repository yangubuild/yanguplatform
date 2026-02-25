
# YANGU — PERMANENT GLOBAL GUARDRAILS

## 🔒 Protected Areas (IMMUTABLE)

The following areas are **permanently locked** and must NOT be modified by any future task unless explicitly overridden by the platform owner:

1. **Landing pages** — all files under `src/components/landing/`, `src/pages/Index.tsx`
2. **Auth flows** — all files under `src/pages/auth/`, `src/components/auth/`
3. **Header components** — `src/components/landing/Header.tsx`, `src/components/mass/MassHeader.tsx`, any global nav headers
4. **Button styles** — primary orange gradient (`--accent`) / secondary neutral green (`--secondary`) / all variant definitions in `src/components/ui/button.tsx`
5. **Logo usage** — logo assets, logo components, favicon
6. **Design tokens / theme files** — `src/index.css` (CSS custom properties), `tailwind.config.ts` (theme extensions)
7. **Global navigation shells** — `src/components/primitives/AppShell.tsx`, `src/components/primitives/MarketingShell.tsx`
8. **Subdomain landings** — `src/components/routing/LiveLanding.tsx`, `src/components/routing/StudioLanding.tsx`, and equivalents

## 📐 Scope Rule

All future feature work must default to:
- Studio tools & pages
- Builder tools & pages
- Surfaces
- Edge functions
- Backend wiring / database

**NOT** global UI, landing, auth, header, buttons, or tokens.

## ⛔ Enforcement

If a future task attempts to modify any protected area, it must be **blocked** and flagged as a guardrail violation — unless the platform owner explicitly overrides with a direct instruction referencing this guardrail.
