# Diagnostic Steps for Missing December Customers

If your December trade pack customers aren't showing up in the admin, follow these steps:

## Step 1: Check Browser Console

1. Open your admin panel: `https://your-domain.com/admin`
2. Open browser Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Refresh the page
5. Look for these log messages:
   - `📥 Admin received bookings: X`
   - `📦 Trade pack requests in response: X`
   - `📅 December 2024 bookings in response: X`

**What to look for:**
- If you see `0` for trade pack requests → They're not in the database
- If you see numbers but they don't appear → There's a display/filtering issue

## Step 2: Check Server Logs

1. Go to your Vercel dashboard
2. Navigate to your project → **Deployments** → Latest deployment
3. Click **Functions** → `api/server.js`
4. Check the **Logs** tab
5. Look for:
   - `📥 Fetching bookings from Supabase`
   - `✅ Fetched X bookings from Supabase`
   - `📦 Trade pack requests before filter: X`
   - `📦 Trade pack requests after filter: X`

**What to look for:**
- If `Fetched 0 bookings` → Supabase connection issue or wrong database
- If numbers decrease after filtering → Filter is removing them (shouldn't happen now)

## Step 3: Run Diagnostic Script

Run the diagnostic script to see what's actually in your database:

```bash
npm run check-db
```

This will show:
- Total bookings in database
- Trade pack requests count
- December 2024 bookings count
- Sample records

**What to look for:**
- If script shows 0 trade pack requests → They're not in this Supabase project
- If script shows them but admin doesn't → API/mapping issue

## Step 4: Check API Diagnostic Endpoint

1. Log into your admin panel
2. Visit: `https://your-domain.com/api/diagnose`
3. This returns JSON with detailed statistics

**What to check:**
- `supabase.connected` should be `true`
- `statistics.tradePackRequests.total` shows count
- `statistics.december2024.total` shows count

## Step 5: Verify Environment Variables

The most common issue is **wrong Supabase project**:

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Check **Production** environment:
   - `SUPABASE_URL` - Should match your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Should match your Supabase service role key
3. Compare with **Project Settings** - they should match!

**Common problems:**
- Production points to a different Supabase project
- Service role key is wrong (using anon key instead)
- Environment variables not set in Production

## Step 6: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → `bookings` table
4. Check:
   - Total row count
   - Filter by `status = 'Trade Pack Request'`
   - Filter by `source = 'trade-landing'`
   - Filter by `created_at` in December 2024

**What to check:**
- If data exists here but not in admin → Environment variable issue
- If data doesn't exist here → It was never saved or was deleted

## Step 7: Test with New Trade Pack Request

1. Go to your trade landing page
2. Submit a test trade pack request
3. Check if it appears in admin immediately
4. Check server logs to see if it was saved

**What this tells you:**
- If new requests work → Old data is in wrong database
- If new requests don't work → Current setup has an issue

## Quick Fixes

### If data is in wrong Supabase project:
1. Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production
2. Redeploy your application
3. Data should appear

### If data was never saved:
- Unfortunately, if the data was never saved to Supabase, it's lost
- Check if you have backups or exports
- Consider re-importing if you have the data elsewhere

### If filtering is the issue:
- The code now NEVER filters out trade pack requests
- Check browser console for `✅ Keeping trade pack/quote request` messages
- If you see warnings about filtering, there's still an issue

## Still Not Working?

If none of these steps reveal the issue:
1. Share the output of `npm run check-db`
2. Share the JSON from `/api/diagnose`
3. Share browser console logs
4. Share server logs from Vercel

This will help identify exactly where the data is being lost.
