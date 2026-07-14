-- Lead pipeline statuses for admin CRM tabs.
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Backfill from existing followed_up flag
UPDATE leads
SET status = 'archived'
WHERE followed_up IS TRUE;

-- Allowed values: new | callback | booked | not_interested | archived
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
