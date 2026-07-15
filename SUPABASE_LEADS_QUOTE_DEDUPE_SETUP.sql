-- Lead quote tracking + indexes for dedupe.
-- Run in Supabase SQL Editor.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_booking_id text;

CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON leads (lower(email));
CREATE INDEX IF NOT EXISTS idx_leads_quoted_at ON leads (quoted_at);
