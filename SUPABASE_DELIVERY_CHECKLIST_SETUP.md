# Delivery Checklist Table Setup

The delivery checklist page at **/delivery-check** saves completed checklists to Supabase.

## Create the table

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Click **SQL Editor** → **New Query**
3. Paste and run the contents of `SUPABASE_DELIVERY_CHECKLIST_SETUP.sql`

## How it works

- **URL:** `https://kitchenrescue.co.uk/delivery-check` (or your domain)
- The delivery person opens the link on site and works through the checklist
- The same link is used for every delivery
- On submit: saves to `delivery_checklists` table and emails a copy to admin

## Table columns

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Auto-generated |
| customer_name | TEXT | Required |
| customer_address | TEXT | Required |
| driveway_length | TEXT | e.g. "8m" |
| driveway_width | TEXT | e.g. "3m" |
| surface_type | TEXT | concrete, tarmac, gravel, etc. |
| gradient | TEXT | flat, slight, moderate, steep |
| checks | JSONB | All checkbox states |
| notes | TEXT | Free text |
| photos | JSONB | Array of { name, data } (base64) |
| created_at | TIMESTAMPTZ | Auto |
