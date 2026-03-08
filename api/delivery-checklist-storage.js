const { supabaseAdmin } = require('./lib/supabaseAdmin');

const supabase = supabaseAdmin;
const useSupabase = !!supabase;

/**
 * Insert a delivery checklist into Supabase.
 */
async function addDeliveryChecklist(data) {
    if (!useSupabase || !supabase) {
        console.warn('⚠️ Supabase not available — delivery checklist not saved');
        return null;
    }
    try {
        const row = {
            customer_name: data.customerName || '—',
            customer_address: data.customerAddress || '—',
            driveway_length: data.drivewayLength || null,
            driveway_width: data.drivewayWidth || null,
            surface_type: data.surfaceType || null,
            gradient: data.gradient || null,
            checks: data.checks || {},
            notes: data.notes || null,
            photos: Array.isArray(data.photos) ? data.photos.map(p => ({ name: p.name, data: p.data })) : []
        };
        const { data: inserted, error } = await supabase
            .from('delivery_checklists')
            .insert([row])
            .select('id, created_at')
            .single();
        if (error) {
            console.error('❌ Delivery checklist insert error:', error.message, error.details);
            return null;
        }
        console.log('✅ Delivery checklist saved:', inserted?.id);
        return inserted;
    } catch (err) {
        console.error('❌ addDeliveryChecklist exception:', err);
        return null;
    }
}

module.exports = { addDeliveryChecklist };
