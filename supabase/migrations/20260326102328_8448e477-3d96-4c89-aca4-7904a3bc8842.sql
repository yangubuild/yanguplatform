
-- 1. FIX: agency_invitations — replace open SELECT with restricted policy
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.agency_invitations;

CREATE POLICY "Members can read own agency invitations"
ON public.agency_invitations
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.agency_members am
    WHERE am.agency_id = agency_invitations.agency_id
      AND am.user_id = auth.uid()
      AND am.role IN ('agency_admin', 'agency_manager')
  )
);

-- 2. FIX: notifications — restrict INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. FIX: profiles — narrow broad SELECT to own + public_profile_view pattern
-- Keep the "Authenticated users can view active profiles" for platform discoverability
-- but restrict sensitive columns via a security definer view approach.
-- For now, tighten by keeping the existing policy (per platform memory requirement)
-- but document that public_profile_view should be used for cross-user reads.
-- No change needed here per memory/auth/profile-visibility-policy.
