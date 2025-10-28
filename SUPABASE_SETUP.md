# Supabase Setup for Kitchen Rescue

## What Was Set Up

The booking system now uses **Supabase** as the database instead of file storage. This allows the app to work properly on Vercel's serverless platform.

## Environment Variables Already Set

You mentioned you've already set up these in Vercel:
- `SUPABASE_URL`
- `SUPABASE_KEY`

## Create the Bookings Table in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Run this SQL to create the bookings table:

```sql
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

-- Enable Row Level Security (optional but recommended)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (for admin access via server)
CREATE POLICY "Allow all operations for admin" ON bookings
  FOR ALL USING (true) WITH CHECK (true);
```

6. Click **Run** to execute the query

## Test It

1. Request a quote on your site
2. Go to `/admin` 
3. You should see the quote request appear!

## How It Works

- **Local Development**: Uses `bookings.json` file
- **Production (Vercel)**: Uses Supabase database
- Automatically switches based on environment variables

## Check Your Supabase Data

1. Go to Supabase dashboard
2. Click **Table Editor** in left sidebar
3. Click on **bookings** table
4. See all your quote requests and bookings!

