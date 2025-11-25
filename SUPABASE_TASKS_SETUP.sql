-- Create tasks table in Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  project TEXT,
  completed BOOLEAN DEFAULT false,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for admin access via server)
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all operations for admin on tasks" ON tasks;
CREATE POLICY "Allow all operations for admin on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for admin on projects" ON projects;
CREATE POLICY "Allow all operations for admin on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

