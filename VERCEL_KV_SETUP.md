# Vercel KV Setup Instructions

## What Was Implemented

The booking system now uses **Vercel KV** (key-value storage) instead of file system storage. This allows the app to work properly on Vercel's serverless platform.

## How It Works

1. **Local Development**: Uses `bookings.json` file system storage
2. **Production (Vercel)**: Uses Vercel KV cloud storage

## Setup Steps for Vercel

### 1. Create Vercel KV Database

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis-compatible key-value store)
6. Choose a name (e.g., `bookings-kv`)
7. Select a region (choose closest to you)
8. Click **Create**

### 2. Configure Environment Variables

After creating the KV database, Vercel will provide you with:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Add these to your Vercel project:
1. Go to **Settings** → **Environment Variables**
2. Add both variables
3. Deploy your project

### 3. Deploy

Push your code to GitHub:
```bash
git push origin main
```

Vercel will automatically deploy. Once deployed, your KV storage will be automatically configured!

## What This Fixes

✅ Quote requests now save persistently on Vercel
✅ Admin panel can see all customer quote requests
✅ Bookings won't be lost after deployment
✅ Availability blocking works in production
✅ All booking operations (CRUD) work on Vercel

## Testing

1. Go to your live site
2. Request a quote (fill out the availability form)
3. Go to `/admin`
4. You should see the quote request with status "Awaiting deposit"
5. You can now follow up with the customer

## Notes

- In local development, it still uses `bookings.json` file
- When you deploy to Vercel, it automatically switches to KV
- No code changes needed after KV setup

