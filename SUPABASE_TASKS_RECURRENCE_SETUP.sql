-- Recurring tasks (none / daily / weekdays / weekly / fortnightly / monthly).
-- Run in Supabase SQL Editor.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence);
