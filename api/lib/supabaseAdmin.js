const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const keySource = process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : "SUPABASE_KEY";

if (!url || !key) {
  console.error("⚠️ Missing SUPABASE_URL and/or Supabase key");
  console.error("  SUPABASE_URL:", url ? "Set" : "MISSING");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "MISSING");
  console.error("  SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Set" : "MISSING");
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
  console.log(`✅ Supabase client initialized using ${keySource}`);
  if (keySource !== "SUPABASE_SERVICE_ROLE_KEY") {
    console.warn("⚠️ SUPABASE_KEY is being used. Use SUPABASE_SERVICE_ROLE_KEY in production to bypass RLS for server-side admin operations.");
  }
} else {
  console.log("⚠️ Supabase admin client not available - will use file system fallback");
}

module.exports = { supabaseAdmin };

