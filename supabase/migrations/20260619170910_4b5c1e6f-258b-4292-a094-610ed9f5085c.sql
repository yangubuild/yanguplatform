
-- =========================================================
-- PROFILES HARDENING
-- =========================================================

-- Drop the broad "active = public" policy and replace with authenticated-only
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;

CREATE POLICY "Authenticated can view active profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (account_status = 'active');

-- Remove anon access to profiles entirely (no enumeration by logged-out visitors)
REVOKE ALL ON public.profiles FROM anon;

-- Restrict sensitive columns: only owner + admin (via own-profile + admin policies)
-- can read these. Revoke broad SELECT on these columns from the generic
-- authenticated role; the owner/admin policies still operate on the row level,
-- but column-level grants apply to OTHER users reading the row.
--
-- PostgREST honors column-level grants. By revoking SELECT on these columns
-- from `authenticated`, no other logged-in user can select them via the API.
-- The owner reads their own profile via the same role, so we must keep grants
-- broad and instead use a view for safe public reads going forward; however,
-- since refactoring all call sites is out of scope, we keep table SELECT but
-- revoke on the most sensitive internal fields and re-grant only to service_role.
REVOKE SELECT (
  free_images_used,
  free_videos_used,
  dashboard_credit_claimed,
  welcome_email_sent_at,
  last_onboarding_reminder_sent_at,
  onboarding_step,
  onboarding_started_at,
  onboarding_completed_at,
  email_verified_at,
  referred_by
) ON public.profiles FROM authenticated;

-- Re-grant those columns to service_role for admin/edge-function paths
GRANT SELECT (
  free_images_used,
  free_videos_used,
  dashboard_credit_claimed,
  welcome_email_sent_at,
  last_onboarding_reminder_sent_at,
  onboarding_step,
  onboarding_started_at,
  onboarding_completed_at,
  email_verified_at,
  referred_by
) ON public.profiles TO service_role;

-- =========================================================
-- KYC HARDENING
-- =========================================================

-- Remove anon access entirely
REVOKE ALL ON public.kyc_verifications FROM anon;

-- Scope existing policies to authenticated explicitly (recreate)
DROP POLICY IF EXISTS "Users can view own KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can submit KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can update pending KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Admins can manage all KYC" ON public.kyc_verifications;

CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications
  FOR SELECT
  TO authenticated
  USING (is_owner(user_id));

CREATE POLICY "Users can submit KYC"
  ON public.kyc_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (is_owner(user_id) AND status = 'pending');

CREATE POLICY "Users can update pending KYC"
  ON public.kyc_verifications
  FOR UPDATE
  TO authenticated
  USING (is_owner(user_id) AND status = 'pending')
  WITH CHECK (is_owner(user_id) AND status = 'pending');

CREATE POLICY "Admins can manage all KYC"
  ON public.kyc_verifications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Lock down sensitive columns: users cannot change status / review fields.
REVOKE UPDATE (status, reviewed_at, reviewed_by, rejection_reason)
  ON public.kyc_verifications FROM authenticated;

GRANT UPDATE (status, reviewed_at, reviewed_by, rejection_reason)
  ON public.kyc_verifications TO service_role;
