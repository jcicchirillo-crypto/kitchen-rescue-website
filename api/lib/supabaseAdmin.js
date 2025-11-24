const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("  SUPABASE_URL:", url ? "Set" : "MISSING");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", key ? "Set" : "MISSING");
  console.error("⚠️ Supabase admin client will not be available");
}

// IMPORTANT: Service role key bypasses RLS policies
// This is safe for server-side operations only
const supabaseAdmin = url && key 
  ? createClient(url, key, {
      auth: { 
        persistSession: false, 
        autoRefreshToken: false 
      },
    })
  : null;

if (supabaseAdmin) {
  console.log("✅ Supabase admin client initialized (bypasses RLS)");
} else {
  console.log("⚠️ Supabase admin client not available - will use file system fallback");
}

module.exports = { supabaseAdmin };

