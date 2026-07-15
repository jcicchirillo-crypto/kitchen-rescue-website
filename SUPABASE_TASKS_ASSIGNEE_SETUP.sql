-- Task assignees (Joe / Keith Robins).
-- Run in Supabase SQL Editor.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assignee text DEFAULT 'joe';

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
