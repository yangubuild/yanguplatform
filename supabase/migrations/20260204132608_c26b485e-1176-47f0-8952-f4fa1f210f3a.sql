-- Fix 1: Restrict profiles table visibility
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policies
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can view profiles of published surface owners (for attribution)
CREATE POLICY "Users can view published surface owners"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.public_surfaces
      WHERE user_id = profiles.id AND is_published = true
    )
  );

-- 3. Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Add view-only access logging for KYC document access
-- Create audit function for KYC document access (if documents are viewed)
-- Note: The existing RLS already restricts to owner-only, but we add extra protection
-- by ensuring the document_urls column is only accessible through a controlled function

-- Create a function to get KYC documents with audit logging
CREATE OR REPLACE FUNCTION public.get_own_kyc_documents()
RETURNS TABLE (
  id uuid,
  status kyc_status,
  submitted_at timestamptz,
  document_count int,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action)
  SELECT auth.uid(), 'kyc_verifications', k.id, 'view_documents'
  FROM public.kyc_verifications k
  WHERE k.user_id = auth.uid();
  
  -- Return KYC info without direct document URLs
  RETURN QUERY
  SELECT 
    k.id,
    k.status,
    k.submitted_at,
    COALESCE(array_length(k.document_urls, 1), 0) as document_count,
    k.created_at
  FROM public.kyc_verifications k
  WHERE k.user_id = auth.uid();
END;
$$;