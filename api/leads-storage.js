const { supabaseAdmin } = require('./lib/supabaseAdmin');

const supabase = supabaseAdmin;
const useSupabase = !!supabase;

/**
 * Insert a lead into the Supabase `leads` table.
 * Table columns: id (uuid), name, email, phone, source, created_at
 * Used for: trade quote calculations, trade quote requests, availability gate, etc.
 */
async function addLead(lead) {
    if (!useSupabase || !supabase) {
        console.warn('⚠️ Supabase not available — lead not saved:', lead?.email);
        return true;
    }
    try {
        const row = {
            name: lead.name || '—',
            email: lead.email || '',
            phone: lead.phone ?? null,
            source: lead.source || 'website'
        };
        const { error } = await supabase
            .from('leads')
            .insert([row])
            .select();
        if (error) {
            console.error('❌ Supabase leads insert error:', error.message, error.details);
            return false;
        }
        console.log('✅ Lead saved to Supabase (leads):', row.email, row.source);
        return true;
    } catch (err) {
        console.error('❌ addLead exception:', err);
        return false;
    }
}

module.exports = { addLead };
