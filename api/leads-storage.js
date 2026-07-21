const { supabaseAdmin } = require('./lib/supabaseAdmin');
const { normalizeLeadRow, normalizeEmail, formatPhone } = require('./csv-import-utils');

const supabase = supabaseAdmin;
const useSupabase = !!supabase;

const LEAD_STATUSES = ['new', 'callback', 'booked', 'not_interested', 'archived'];
const LEAD_SELECT = 'id, name, email, phone, source, created_at, followed_up, notes, status, quoted_at, quote_booking_id';
const LEAD_SELECT_LEGACY = 'id, name, email, phone, source, created_at, followed_up, notes, status';

const META_SOURCE_HINTS = ['meta', 'paid', 'csv-import', 'facebook', 'instagram', 'fb', 'ig'];

function isMetaSource(source) {
    const s = String(source || '').toLowerCase().trim();
    if (!s) return false;
    return META_SOURCE_HINTS.some((hint) => s === hint || s.includes(hint));
}

function leadChannel(source) {
    return isMetaSource(source) ? 'meta' : 'website';
}

function phoneDigits(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '';
    // Normalise UK mobiles to last 10 digits for comparison
    if (digits.startsWith('44') && digits.length >= 12) return digits.slice(-10);
    if (digits.startsWith('0') && digits.length >= 11) return digits.slice(-10);
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

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
        channel: leadChannel(row.source),
        quoted_at: row.quoted_at || null,
        quote_booking_id: row.quote_booking_id || null,
    };
}

function appendNotes(existing, addition) {
    const a = String(addition || '').trim();
    if (!a) return existing || null;
    const e = String(existing || '').trim();
    if (!e) return a;
    if (e.includes(a)) return e;
    return `${e}\n${a}`;
}

/**
 * Find an existing lead by email (preferred) or phone.
 */
async function findExistingLead({ email, phone, id } = {}) {
    if (!useSupabase || !supabase) return null;
    try {
        if (id) {
            const { data, error } = await supabase.from('leads').select(LEAD_SELECT).eq('id', id).maybeSingle();
            if (!error && data) return mapLead(data);
            if (error && (error.message?.includes('quoted_at') || error.code === '42703')) {
                const retry = await supabase.from('leads').select(LEAD_SELECT_LEGACY).eq('id', id).maybeSingle();
                if (!retry.error && retry.data) return mapLead(retry.data);
            }
        }

        const e = normalizeEmail(email);
        if (e) {
            const { data, error } = await supabase
                .from('leads')
                .select(LEAD_SELECT)
                .ilike('email', e)
                .limit(10);
            if (!error && data?.length) {
                const match = data.find((row) => normalizeEmail(row.email) === e);
                if (match) return mapLead(match);
            } else if (error && (error.message?.includes('quoted_at') || error.code === '42703')) {
                const retry = await supabase.from('leads').select(LEAD_SELECT_LEGACY).ilike('email', e).limit(10);
                const match = (retry.data || []).find((row) => normalizeEmail(row.email) === e);
                if (match) return mapLead(match);
            }
        }

        const digits = phoneDigits(phone);
        if (digits && digits.length >= 8) {
            let rows = [];
            const { data, error } = await supabase
                .from('leads')
                .select(LEAD_SELECT)
                .not('phone', 'is', null)
                .order('created_at', { ascending: false })
                .limit(800);
            if (!error && data) {
                rows = data;
            } else {
                const retry = await supabase
                    .from('leads')
                    .select(LEAD_SELECT_LEGACY)
                    .not('phone', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(800);
                rows = retry.data || [];
            }
            const match = rows.find((row) => {
                const d = phoneDigits(row.phone);
                return d && (d === digits || d.endsWith(digits) || digits.endsWith(d));
            });
            if (match) return mapLead(match);
        }
    } catch (err) {
        console.error('❌ findExistingLead exception:', err);
    }
    return null;
}

/**
 * Insert or merge a lead. Same email/phone → one lead (no duplicates).
 */
async function addLead(lead) {
    if (!useSupabase || !supabase) {
        console.warn('⚠️ Supabase not available — lead not saved:', lead?.email);
        return true;
    }
    try {
        const email = normalizeEmail(lead.email);
        const phone = formatPhone(lead.phone) || lead.phone || null;
        const source = lead.source || 'website';
        const existing = await findExistingLead({
            id: lead.id,
            email,
            phone,
        });

        if (existing) {
            const patch = {};
            if (phone && !existing.phone) patch.phone = phone;
            if (lead.name && lead.name !== '—' && (!existing.name || existing.name === '—')) {
                patch.name = lead.name;
            }
            if (lead.notes) patch.notes = appendNotes(existing.notes, lead.notes);
            if (source && source !== existing.source) {
                patch.notes = appendNotes(
                    patch.notes || existing.notes,
                    `Also contacted via ${source}`
                );
            }
            if (Object.keys(patch).length > 0) {
                await updateLead(existing.id, patch);
            }
            console.log('✅ Lead deduped (existing):', existing.email || existing.id, '←', source);
            return true;
        }

        const row = {
            name: lead.name || '—',
            email: email || lead.email || '',
            phone,
            source,
            status: lead.status && LEAD_STATUSES.includes(lead.status) ? lead.status : 'new',
        };
        if (lead.notes) row.notes = lead.notes;
        if (lead.quoted_at) row.quoted_at = lead.quoted_at;
        if (lead.quote_booking_id) row.quote_booking_id = lead.quote_booking_id;

        const { error } = await supabase.from('leads').insert([row]).select();
        if (error) {
            if (error.message?.includes('quoted_at') || error.message?.includes('quote_booking_id') || error.code === '42703') {
                delete row.quoted_at;
                delete row.quote_booking_id;
                if (error.message?.includes('status')) delete row.status;
                const retry = await supabase.from('leads').insert([row]).select();
                if (retry.error) {
                    console.error('❌ Supabase leads insert error:', retry.error.message, retry.error.details);
                    return false;
                }
                console.log('✅ Lead saved (legacy columns):', row.email, row.source);
                return true;
            }
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
 * After a quote is sent, attach it to the matching lead (create if needed).
 * Keeps Meta + website + quote as one lead record.
 */
async function markLeadQuoted({
    leadId,
    name,
    email,
    phone,
    bookingId,
    totalCost,
    source,
    startDate,
    endDate,
    days,
    notes,
} = {}) {
    if (!useSupabase || !supabase) return { ok: false, error: 'Supabase not available' };

    const when = startDate && endDate
        ? `${startDate} → ${endDate}${days ? ` (${days} days)` : ''}`
        : null;
    const noteLine = [
        'Quote sent',
        bookingId ? `(${bookingId})` : null,
        when,
        totalCost != null && totalCost !== '' ? `£${Number(totalCost).toFixed(2)}` : null,
        source ? `via ${source}` : null,
    ].filter(Boolean).join(' ');

    let existing = await findExistingLead({ id: leadId, email, phone });

    if (!existing) {
        await addLead({
            name: name || '—',
            email,
            phone,
            source: source === 'admin-custom-quote' ? 'website' : (source || 'website'),
            status: 'callback',
            notes: appendNotes(notes, noteLine),
            quoted_at: new Date().toISOString(),
            quote_booking_id: bookingId || null,
        });
        existing = await findExistingLead({ email, phone });
        return { ok: !!existing, lead: existing, created: true };
    }

    const patch = {
        notes: appendNotes(appendNotes(existing.notes, notes), noteLine),
        quoted_at: new Date().toISOString(),
        quote_booking_id: bookingId || existing.quote_booking_id || null,
    };
    if (existing.status === 'new') patch.status = 'callback';
    if (phone && !existing.phone) patch.phone = formatPhone(phone) || phone;
    if (name && name !== '—' && (!existing.name || existing.name === '—')) patch.name = name;

    const updated = await updateLead(existing.id, patch);
    return { ok: updated.ok, lead: updated.lead || existing, created: false };
}

/**
 * Fetch all leads from the Supabase `leads` table (for admin panel).
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
            if (error.message?.includes('status') || error.message?.includes('quoted_at') || error.code === '42703') {
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
 * Update status, follow-up flag, notes, quote link, and/or contact fields for a lead.
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
    if (typeof updates.name === 'string' && updates.name.trim()) row.name = updates.name.trim();
    if (updates.phone !== undefined) row.phone = formatPhone(updates.phone) || updates.phone || null;
    if (updates.quoted_at !== undefined) row.quoted_at = updates.quoted_at;
    if (updates.quote_booking_id !== undefined) row.quote_booking_id = updates.quote_booking_id;
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
            if (error.message?.includes('status') || error.message?.includes('quoted_at') || error.code === '42703') {
                const legacy = { ...row };
                delete legacy.status;
                delete legacy.quoted_at;
                delete legacy.quote_booking_id;
                if (Object.keys(legacy).length === 0) {
                    return { ok: false, error: 'Run SUPABASE_LEADS_QUOTE_DEDUPE_SETUP.sql / STATUS_SETUP.sql' };
                }
                const retry = await supabase
                    .from('leads')
                    .update(legacy)
                    .eq('id', id)
                    .select(LEAD_SELECT_LEGACY)
                    .single();
                if (retry.error) {
                    // Retry again without status
                    const bare = { ...legacy };
                    delete bare.status;
                    const retry2 = await supabase
                        .from('leads')
                        .update(bare)
                        .eq('id', id)
                        .select('id, name, email, phone, source, created_at, followed_up, notes')
                        .single();
                    if (retry2.error) {
                        console.error('❌ Supabase leads update error:', retry2.error.message);
                        return { ok: false, error: retry2.error.message };
                    }
                    return { ok: true, lead: mapLead({ ...retry2.data, status: row.status, quoted_at: row.quoted_at }) };
                }
                return { ok: true, lead: mapLead({ ...retry.data, status: row.status, quoted_at: row.quoted_at }) };
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
 * Dedupe by email OR phone; merge missing contact details on match.
 */
async function importLeads(rows, options = {}) {
    const skipDuplicates = options.skipDuplicates !== false;
    const defaultSource = options.defaultSource || 'meta';

    if (!useSupabase || !supabase) {
        return { ok: false, error: 'Supabase not available', inserted: 0, skipped: 0, merged: 0, failed: 0, results: [] };
    }
    if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, error: 'No rows to import', inserted: 0, skipped: 0, merged: 0, failed: 0, results: [] };
    }

    const { data: existing, error: fetchError } = await supabase
        .from('leads')
        .select('id, email, phone, name, notes, source');
    if (fetchError) {
        return { ok: false, error: fetchError.message, inserted: 0, skipped: 0, merged: 0, failed: 0, results: [] };
    }

    const emailToLead = new Map();
    const phoneToLead = new Map();
    for (const row of existing || []) {
        const e = normalizeEmail(row.email);
        if (e) emailToLead.set(e, row);
        const d = phoneDigits(row.phone);
        if (d) phoneToLead.set(d, row);
    }
    const batchEmails = new Set();
    const batchPhones = new Set();

    const results = [];
    let inserted = 0;
    let skipped = 0;
    let merged = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
        const normalized = normalizeLeadRow(rows[i], defaultSource);
        // Force Meta for importer default unless row already has a non-meta website source
        if (!rows[i]?.source && defaultSource) {
            normalized.source = defaultSource;
        }
        const label = normalized.name || normalized.email || `Row ${i + 1}`;
        const digits = phoneDigits(normalized.phone);

        if (!normalized.email && !digits) {
            failed += 1;
            results.push({ index: i, status: 'failed', name: label, reason: 'Missing email and phone' });
            continue;
        }

        const existingMatch = (normalized.email && emailToLead.get(normalized.email))
            || (digits && phoneToLead.get(digits))
            || null;
        const batchDup = (normalized.email && batchEmails.has(normalized.email))
            || (digits && batchPhones.has(digits));

        if (skipDuplicates && (existingMatch || batchDup)) {
            if (existingMatch && !batchDup) {
                const patch = {};
                if (normalized.phone && !existingMatch.phone) patch.phone = normalized.phone;
                if (normalized.name && normalized.name !== '—' && (!existingMatch.name || existingMatch.name === '—')) {
                    patch.name = normalized.name;
                }
                if (normalized.notes) patch.notes = appendNotes(existingMatch.notes, normalized.notes);
                if (normalized.source && normalized.source !== existingMatch.source) {
                    patch.notes = appendNotes(
                        patch.notes || existingMatch.notes,
                        `Also imported from ${normalized.source}`
                    );
                }
                if (Object.keys(patch).length > 0) {
                    await updateLead(existingMatch.id, patch);
                    merged += 1;
                    results.push({
                        index: i,
                        status: 'merged',
                        name: label,
                        email: normalized.email,
                        reason: 'Matched existing lead — details updated',
                    });
                    continue;
                }
            }
            skipped += 1;
            results.push({
                index: i,
                status: 'skipped',
                name: label,
                email: normalized.email,
                reason: existingMatch ? 'Duplicate email/phone' : 'Duplicate in this file',
            });
            continue;
        }

        const payload = {
            name: normalized.name,
            email: normalized.email || '',
            phone: normalized.phone,
            source: normalized.source || defaultSource,
            notes: normalized.notes,
            status: 'new',
        };
        if (normalized.created_at) payload.created_at = normalized.created_at;

        const { error } = await supabase.from('leads').insert([payload]);
        if (error) {
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

        if (normalized.email) {
            batchEmails.add(normalized.email);
            emailToLead.set(normalized.email, payload);
        }
        if (digits) {
            batchPhones.add(digits);
            phoneToLead.set(digits, payload);
        }
        inserted += 1;
        results.push({ index: i, status: 'inserted', name: label, email: normalized.email });
    }

    return { ok: true, inserted, skipped, merged, failed, results };
}

module.exports = {
    addLead,
    getAllLeads,
    updateLead,
    importLeads,
    findExistingLead,
    markLeadQuoted,
    isMetaSource,
    leadChannel,
    LEAD_STATUSES,
};
