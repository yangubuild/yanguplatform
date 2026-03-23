-- Reset KYC for stuck user akaserengaitjoan1@gmail.com (user_id: 03a3dbcf-3255-4b0a-91a7-34553a240b5b)
-- Clear metadata so they can restart fresh
UPDATE kyc_verifications 
SET status = 'pending', 
    metadata = '{}'::jsonb, 
    submitted_at = NULL, 
    reviewed_at = NULL, 
    rejection_reason = NULL,
    updated_at = now()
WHERE user_id = '03a3dbcf-3255-4b0a-91a7-34553a240b5b';