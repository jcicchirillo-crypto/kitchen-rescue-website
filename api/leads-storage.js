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

/**
 * Fetch all leads from the Supabase `leads` table (for admin panel).
 * Returns array of { id, name, email, phone, source, created_at }.
 */
async function getAllLeads() {
    if (!useSupabase || !supabase) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, source, created_at')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('❌ Supabase leads fetch error:', error.message, error.details);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('❌ getAllLeads exception:', err);
        return [];
    }
}

module.exports = { addLead, getAllLeads };
