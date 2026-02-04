-- Function to sync KYC approval from user to their orgs
CREATE OR REPLACE FUNCTION public.sync_kyc_to_org_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a user's KYC is approved, update org_billing for all orgs where they are owner/admin
  IF NEW.status = 'approved' THEN
    UPDATE public.org_billing ob
    SET kyc_status = 'approved', updated_at = now()
    FROM public.org_memberships om
    WHERE om.org_id = ob.org_id
      AND om.user_id = NEW.user_id
      AND om.role IN ('owner', 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on kyc_verifications
DROP TRIGGER IF EXISTS sync_kyc_to_org_billing_trigger ON public.kyc_verifications;
CREATE TRIGGER sync_kyc_to_org_billing_trigger
  AFTER INSERT OR UPDATE OF status ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_kyc_to_org_billing();

-- Backfill: sync all existing approved KYC records to their orgs
UPDATE public.org_billing ob
SET kyc_status = 'approved', updated_at = now()
FROM public.kyc_verifications kv
JOIN public.org_memberships om ON om.user_id = kv.user_id
WHERE kv.status = 'approved'
  AND om.org_id = ob.org_id
  AND om.role IN ('owner', 'admin')
  AND ob.kyc_status != 'approved';