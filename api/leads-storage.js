const { supabaseAdmin } = require('./lib/supabaseAdmin');
const { normalizeLeadRow, normalizeEmail } = require('./csv-import-utils');

const supabase = supabaseAdmin;
const useSupabase = !!supabase;

const LEAD_STATUSES = ['new', 'callback', 'booked', 'not_interested', 'archived'];
const LEAD_SELECT = 'id, name, email, phone, source, created_at, followed_up, notes, status';

function resolveStatus(lead) {
    if (lead?.status && LEAD_STATUSES.includes(lead.status)) return lead.status;
    return lead?.followed_up ? 'archived' : 'new';
}

function mapLead(row) {
    if (!row) return row;
    const status = resolveStatus(row);
    return {
        ...row,
        status,
        followed_up: status === 'archived' || !!row.followed_up,
    };
}

/**
 * Insert a lead into the Supabase `leads` table.
 * Table columns: id (uuid), name, email, phone, source, created_at, status
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
            source: lead.source || 'website',
            status: lead.status && LEAD_STATUSES.includes(lead.status) ? lead.status : 'new',
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
 * Returns array of { id, name, email, phone, source, created_at, followed_up, notes, status }.
 */
async function getAllLeads() {
    if (!useSupabase || !supabase) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('leads')
            .select(LEAD_SELECT)
            .order('created_at', { ascending: false });
        if (error) {
            // Fallback if status column not migrated yet
            if (error.message?.includes('status') || error.code === '42703') {
                const fallback = await supabase
                    .from('leads')
                    .select('id, name, email, phone, source, created_at, followed_up, notes')
                    .order('created_at', { ascending: false });
                if (fallback.error) {
                    console.error('❌ Supabase leads fetch error:', fallback.error.message);
                    return [];
                }
                return (fallback.data || []).map(mapLead);
            }
            console.error('❌ Supabase leads fetch error:', error.message, error.details);
            return [];
        }
        return (data || []).map(mapLead);
    } catch (err) {
        console.error('❌ getAllLeads exception:', err);
        return [];
    }
}

/**
 * Update status, follow-up flag, and/or notes for a lead.
 */
async function updateLead(id, updates) {
    if (!useSupabase || !supabase) {
        return { ok: false, error: 'Supabase not available' };
    }
    const row = {};
    if (typeof updates.status === 'string' && LEAD_STATUSES.includes(updates.status)) {
        row.status = updates.status;
        row.followed_up = updates.status === 'archived';
    } else if (typeof updates.followed_up === 'boolean') {
        row.followed_up = updates.followed_up;
        row.status = updates.followed_up ? 'archived' : 'new';
    }
    if (typeof updates.notes === 'string') row.notes = updates.notes;
    if (Object.keys(row).length === 0) {
        return { ok: false, error: 'No valid fields to update' };
    }
    try {
        const { data, error } = await supabase
            .from('leads')
            .update(row)
            .eq('id', id)
            .select(LEAD_SELECT)
            .single();
        if (error) {
            // Retry without status if column missing
            if (error.message?.includes('status') || error.code === '42703') {
                const legacy = {};
                if (typeof row.followed_up === 'boolean') legacy.followed_up = row.followed_up;
                if (typeof row.notes === 'string') legacy.notes = row.notes;
                if (Object.keys(legacy).length === 0) {
                    return { ok: false, error: 'Run SUPABASE_LEADS_STATUS_SETUP.sql to enable status updates' };
                }
                const retry = await supabase
                    .from('leads')
                    .update(legacy)
                    .eq('id', id)
                    .select('id, name, email, phone, source, created_at, followed_up, notes')
                    .single();
                if (retry.error) {
                    console.error('❌ Supabase leads update error:', retry.error.message);
                    return { ok: false, error: retry.error.message };
                }
                return { ok: true, lead: mapLead({ ...retry.data, status: row.status }) };
            }
            console.error('❌ Supabase leads update error:', error.message, error.details);
            return { ok: false, error: error.message };
        }
        return { ok: true, lead: mapLead(data) };
    } catch (err) {
        console.error('❌ updateLead exception:', err);
        return { ok: false, error: err.message };
    }
}

/**
 * Bulk import leads from mapped CSV rows.
 * Returns counts and per-row outcomes.
 */
async function importLeads(rows, options = {}) {
    const skipDuplicates = options.skipDuplicates !== false;
    const defaultSource = options.defaultSource || 'csv-import';

    if (!useSupabase || !supabase) {
        return { ok: false, error: 'Supabase not available', inserted: 0, skipped: 0, failed: 0, results: [] };
    }
    if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, error: 'No rows to import', inserted: 0, skipped: 0, failed: 0, results: [] };
    }

    const { data: existing, error: fetchError } = await supabase
        .from('leads')
        .select('email');
    if (fetchError) {
        return { ok: false, error: fetchError.message, inserted: 0, skipped: 0, failed: 0, results: [] };
    }

    const existingEmails = new Set(
        (existing || []).map((row) => normalizeEmail(row.email)).filter(Boolean)
    );
    const batchEmails = new Set();

    const results = [];
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
        const normalized = normalizeLeadRow(rows[i], defaultSource);
        const label = normalized.name || normalized.email || `Row ${i + 1}`;

        if (!normalized.email) {
            failed += 1;
            results.push({ index: i, status: 'failed', name: label, reason: 'Missing or invalid email' });
            continue;
        }

        if (skipDuplicates && (existingEmails.has(normalized.email) || batchEmails.has(normalized.email))) {
            skipped += 1;
            results.push({ index: i, status: 'skipped', name: label, email: normalized.email, reason: 'Duplicate email' });
            continue;
        }

        const payload = {
            name: normalized.name,
            email: normalized.email,
            phone: normalized.phone,
            source: normalized.source,
            notes: normalized.notes,
            status: 'new',
        };
        if (normalized.created_at) payload.created_at = normalized.created_at;

        const { error } = await supabase.from('leads').insert([payload]);
        if (error) {
            // Retry without status if column not migrated
            if (error.message?.includes('status') || error.code === '42703') {
                delete payload.status;
                const retry = await supabase.from('leads').insert([payload]);
                if (retry.error) {
                    failed += 1;
                    results.push({ index: i, status: 'failed', name: label, email: normalized.email, reason: retry.error.message });
                    continue;
                }
            } else {
                failed += 1;
                results.push({ index: i, status: 'failed', name: label, email: normalized.email, reason: error.message });
                continue;
            }
        }

        batchEmails.add(normalized.email);
        existingEmails.add(normalized.email);
        inserted += 1;
        results.push({ index: i, status: 'inserted', name: label, email: normalized.email });
    }

    return { ok: true, inserted, skipped, failed, results };
}

module.exports = { addLead, getAllLeads, updateLead, importLeads, LEAD_STATUSES };
