-- Add follow-up tracking columns to the leads table.
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS followed_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

UPDATE leads
SET status = 'archived'
WHERE followed_up IS TRUE AND (status IS NULL OR status = 'new');

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
