

## Diagnosis

After thorough investigation, here is what's happening:

**Root cause**: When `SocialAuthButtons` calls `cloudAuth.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`, the `redirect_uri` is set to just `https://yangu.io` (the bare origin). After the Lovable Cloud OAuth broker completes the Google sign-in, it redirects the user back to this URL — which is the **landing page** (`/`), not the **auth callback page** (`/auth/callback`).

On previously-logged-in devices, the Supabase session cookie is already present so `AuthProvider` picks it up. On **new devices**, the tokens from the broker need to be detected and processed. The landing page (`Index`) does not have the logic to handle an incoming OAuth redirect — only `AuthCallback` does. The result: the user lands on the homepage without a session.

This is a one-line root-cause fix, not a platform issue.

**What I will change (3 targeted fixes):**

### Fix A — OAuth redirect destination (the actual login fix)

**File**: `src/components/auth/SocialAuthButtons.tsx`

Change `redirect_uri` from `window.location.origin` to `window.location.origin + '/auth/callback'` so the broker sends users to the callback page which properly detects the session and routes to dashboard/onboarding.

```
// Before
redirect_uri: window.location.origin,

// After  
redirect_uri: `${window.location.origin}/auth/callback`,
```

Also update the iframe/web_message post-auth redirect in the same file to use the existing `getPostAuthDestination()` (already correct).

### Fix B — AuthCallback resilience

**File**: `src/pages/auth/AuthCallback.tsx`

Add a small delay + retry for `getSession()` to handle the case where the Supabase client hasn't finished processing URL tokens yet. Also add hash-fragment detection so if tokens arrive via URL hash, the callback page waits for them to be processed before declaring "no session."

### Fix C — MassHeader button consistency

**File**: `src/components/mass/MassHeader.tsx`

The "Sign in" button uses `variant="outline"` instead of the global orange gradient. Change it to `variant="accent"` to match all other primary auth CTAs.

---

**What I will NOT change:**
- No redesigns, no demo video changes, no studio layout changes
- The `src/integrations/lovable/index.ts` file (auto-generated, must not edit)
- No changes to the Supabase client or auth provider structure

**Expected result:**
- New devices (iPhone, iPad, any browser) will complete Google OAuth and land on `/auth/callback`, which detects the session and redirects to `/dashboard` or `/onboarding`
- No more "bounce to landing page" behavior

