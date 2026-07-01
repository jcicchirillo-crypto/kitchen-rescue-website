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
 * Returns array of { id, name, email, phone, source, created_at, followed_up, notes }.
 */
async function getAllLeads() {
    if (!useSupabase || !supabase) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, source, created_at, followed_up, notes')
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

/**
 * Update follow-up status and/or notes for a lead.
 */
async function updateLead(id, updates) {
    if (!useSupabase || !supabase) {
        return { ok: false, error: 'Supabase not available' };
    }
    const row = {};
    if (typeof updates.followed_up === 'boolean') row.followed_up = updates.followed_up;
    if (typeof updates.notes === 'string') row.notes = updates.notes;
    if (Object.keys(row).length === 0) {
        return { ok: false, error: 'No valid fields to update' };
    }
    try {
        const { data, error } = await supabase
            .from('leads')
            .update(row)
            .eq('id', id)
            .select('id, name, email, phone, source, created_at, followed_up, notes')
            .single();
        if (error) {
            console.error('❌ Supabase leads update error:', error.message, error.details);
            return { ok: false, error: error.message };
        }
        return { ok: true, lead: data };
    } catch (err) {
        console.error('❌ updateLead exception:', err);
        return { ok: false, error: err.message };
    }
}

module.exports = { addLead, getAllLeads, updateLead };
