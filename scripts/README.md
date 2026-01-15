# Database Diagnostic Tools

## Check Database Script

The `check-database.js` script helps you diagnose issues with your Supabase database connection and see what data is actually stored.

### Usage

```bash
npm run check-db
```

Or directly:

```bash
node scripts/check-database.js
```

### What It Shows

- ✅ Verifies Supabase connection
- 📊 Statistics by status, source, and month
- 📦 Lists all trade pack requests
- 📅 Lists all December 2024 bookings
- 📋 Shows recent bookings

### Requirements

Make sure you have these environment variables set in your `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Diagnostic Endpoint

You can also check the database via the API endpoint (requires admin authentication):

```
GET /api/diagnose
```

This returns JSON with:
- Supabase connection status
- Raw data statistics
- Mapped data statistics
- Sample records
- Error details if any

### Usage

1. Log into your admin panel
2. Visit: `https://your-domain.com/api/diagnose`
3. Or use curl:
   ```bash
   curl -H "Authorization: Bearer dummy_token" https://your-domain.com/api/diagnose
   ```

## Troubleshooting

### If you see "Missing Supabase credentials"
- Check your `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Make sure you're running from the project root directory

### If you see connection errors
- Verify your Supabase URL is correct
- Verify your service role key is correct (not the anon key!)
- Check your Supabase project is active

### If December customers are missing
- Run the diagnostic to see if they exist in the database
- Check if they're in a different Supabase project
- Verify environment variables match between local and production
