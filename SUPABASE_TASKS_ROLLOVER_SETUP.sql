-- Track tasks that rolled from a previous day (show in red in Planner).
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS rolled_over boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_date text;
