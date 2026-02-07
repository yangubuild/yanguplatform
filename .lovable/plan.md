
# Landing Page 1:1 Clone Implementation

## Scope Confirmation

**ONLY** the following will change:
- `src/pages/Index.tsx` - Complete rewrite
- `src/assets/yangu-logo.png` - New file (copy of uploaded logo)

**ZERO changes to:**
- Navigation, onboarding, signup, dashboard, or community pages
- Routing configuration (`src/config/routes.ts`)
- Authentication logic or backend
- Any other files in the project

---

## Implementation Details

### File 1: Logo Asset

Copy the uploaded logo to `src/assets/yangu-logo.png`

### File 2: Index.tsx Rewrite

Replace entire content with a self-contained sign-in card component matching the reference exactly:

**Structure:**
```text
Full-screen gradient background (slate-50 to slate-100)
  └── Centered Card (max-w-md, white/95, rounded-2xl, shadow-2xl)
        ├── Top gradient accent line (orange→amber→yellow)
        ├── YANGU Logo (circular, ring effect)
        ├── "Welcome to YANGU" heading
        ├── "Sign in to continue" subheading
        ├── Google social button (inline SVG)
        ├── Microsoft social button (inline SVG)
        ├── Facebook social button (inline SVG)
        ├── "OR" divider line
        ├── Email input with mail icon
        ├── Password input with lock icon
        ├── Dark "Sign In" button
        └── Footer links (Forgot password? / Sign up)
```

**Exact styling from reference:**
- Background: `bg-gradient-to-br from-slate-50 to-slate-100`
- Card: `bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10`
- Logo: `h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white/50`
- Title: `text-2xl sm:text-3xl font-bold text-slate-900`
- Social buttons: `py-3.5 px-5 rounded-xl border-slate-200 bg-white text-slate-700`
- Inputs: `h-11 sm:h-12 pl-10 bg-slate-50/50 border-slate-200 rounded-xl`
- Sign In button: `h-11 sm:h-12 bg-slate-900 text-white rounded-xl`

**Link destinations (using existing routes):**
- "Forgot password?" → `/auth/reset-password`
- "Sign up" → `/auth/signup`
- Social buttons → Trigger existing OAuth or link to `/auth/login`

---

## Verification

After implementation, the landing page at `/` will visually match `https://digitalcommunity.space/test` exactly, with only the logo changed to YANGU.
