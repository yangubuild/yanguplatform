
ALTER TABLE email_triggers ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;
ALTER TABLE email_triggers ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;
ALTER TABLE email_triggers ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE email_triggers ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

ALTER TABLE management_team_members ADD COLUMN IF NOT EXISTS didit_session_id TEXT;
ALTER TABLE management_team_members ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMPTZ;
