-- Create delivery_checklists table in Supabase
-- Run this in Supabase SQL Editor
-- Used by /delivery-check page

CREATE TABLE IF NOT EXISTS delivery_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  driveway_length TEXT,
  driveway_width TEXT,
  surface_type TEXT,
  gradient TEXT,
  checks JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE delivery_checklists ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for server-side insert via service role)
DROP POLICY IF EXISTS "Allow all operations for delivery_checklists" ON delivery_checklists;
CREATE POLICY "Allow all operations for delivery_checklists" ON delivery_checklists
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_delivery_checklists_created_at ON delivery_checklists(created_at DESC);
