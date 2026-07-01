-- Add follow-up tracking columns to the leads table.
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS followed_up boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;
