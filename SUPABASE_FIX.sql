-- Fix for Supabase bookings table
-- Add missing columns as needed

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS collectionCost DECIMAL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT;
-- Tracks when the "balance due" reminder email was sent, so the daily cron
-- (/api/cron/send-balance-reminders) never emails the same customer twice.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;

-- If table doesn't exist yet, use this full schema:

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  postcode TEXT,
  selectedDates TEXT[],
  startDate TEXT,
  endDate TEXT,
  days INTEGER,
  dailyCost DECIMAL,
  deliveryCost DECIMAL,
  collectionCost DECIMAL,
  totalCost DECIMAL,
  notes TEXT,
  status TEXT DEFAULT 'Awaiting deposit',
  source TEXT,
  pod TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (for admin access via server)
CREATE POLICY IF NOT EXISTS "Allow all operations for admin" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

