-- Ensure bookings can store quote vs website source.
-- Run in Supabase SQL Editor.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Backfill: anything that already had a quote email sent counts as a quote
UPDATE bookings
SET source = 'quote'
WHERE quote_sent_at IS NOT NULL
  AND (source IS NULL OR source = '');
