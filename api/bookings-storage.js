const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('./lib/supabaseAdmin');

// Use admin client if available (bypasses RLS)
const supabase = supabaseAdmin;
const useSupabase = !!supabaseAdmin;

if (useSupabase) {
    console.log('✅ Using Supabase admin client for bookings storage (bypasses RLS)');
} else {
    console.log('⚠️ Supabase admin client not available - falling back to file system (will not work on Vercel!)');
}

const BOOKINGS_KEY = 'bookings';

// Get all bookings
async function getAllBookings() {
    if (useSupabase && supabase) {
        try {
            console.log('📥 Fetching bookings from Supabase (admin client)...');
            console.log('🔍 Supabase client available:', !!supabase);
            console.log('🔍 Supabase URL:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'MISSING');
            
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });
            
            console.log('🔍 Supabase query completed');
            console.log('   Data present:', !!data);
            console.log('   Data length:', data?.length || 0);
            console.log('   Error present:', !!error);
            
            if (error) {
                console.error('❌❌❌ SUPABASE SELECT ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                console.error('⚠️ Returning empty array due to error - this will cause 0 bookings in admin!');
                return [];
            }
            
            // Log if we got data but it's empty
            if (!data || data.length === 0) {
                console.warn('⚠️ Supabase query returned empty array (no bookings in database)');
                console.warn('   This could mean:');
                console.warn('   1. Database is actually empty');
                console.warn('   2. Wrong Supabase project (check SUPABASE_URL)');
                console.warn('   3. Table name is wrong or table doesn\'t exist');
            }
            
            console.log(`✅ Fetched ${data?.length || 0} bookings from Supabase`);
            
            // Count trade pack requests specifically
            const tradePackCount = (data || []).filter(b => 
                b.status === 'Trade Pack Request' || 
                b.source === 'trade-landing' || 
                b.source === 'trade-quote' ||
                b.source === 'trade-quote-calculated'
            ).length;
            console.log(`📦 Found ${tradePackCount} trade pack/quote requests in raw data`);
            
            if (data && data.length > 0) {
                console.log('Sample booking:', {
                    id: data[0].id,
                    booking_reference: data[0].booking_reference,
                    customer_name: data[0].customer_name,
                    customer_email: data[0].customer_email,
                    status: data[0].status,
                    source: data[0].source,
                    created_at: data[0].created_at
                });
            }
            
            // Map Supabase schema to expected format for admin
            // Handle edge cases for old bookings that might have different field names
            const mappedData = (data || []).map(booking => {
                // Try multiple possible ID fields for backwards compatibility
                const bookingId = booking.booking_reference || booking.id || booking.booking_id || `booking-${booking.created_at || Date.now()}`;
                
                // Try multiple possible name fields
                const customerName = booking.customer_name || booking.name || booking.customerName || 'Unknown';
                
                // Try multiple possible email fields
                // Handle null/undefined explicitly - don't convert to empty string yet
                const customerEmail = booking.customer_email || booking.email || booking.customerEmail || null;
                
                // Try multiple possible phone fields
                const customerPhone = booking.customer_phone || booking.phone || booking.customerPhone || null;
                
                // Handle selected dates - Supabase may store as JSON string "[\"2025-12-01\", ...]" or array
                let selectedDates = [];
                if (Array.isArray(booking.selected_dates)) {
                    selectedDates = booking.selected_dates;
                } else if (typeof booking.selected_dates === 'string') {
                    try {
                        const parsed = JSON.parse(booking.selected_dates);
                        selectedDates = Array.isArray(parsed) ? parsed : (parsed ? [String(parsed)] : []);
                    } catch (_) {
                        selectedDates = [];
                    }
                } else if (booking.selected_dates) {
                    selectedDates = [booking.selected_dates];
                } else if (booking.selectedDates) {
                    const sd = booking.selectedDates;
                    selectedDates = Array.isArray(sd) ? sd : (typeof sd === 'string' ? (() => { try { const p = JSON.parse(sd); return Array.isArray(p) ? p : []; } catch(_) { return []; } })() : []);
                }
                
                // Handle dates - try multiple field names
                const deliveryDate = booking.delivery_date || booking.deliveryDate || booking.startDate || null;
                const hireLength = booking.hire_length || booking.hireLength || booking.days || null;
                
                let startDate = null;
                let endDate = null;
                if (deliveryDate) {
                    try {
                        const d = new Date(deliveryDate);
                        if (!isNaN(d.getTime())) {
                            startDate = d.toISOString();
                            if (hireLength && Number(hireLength) > 0) {
                                const end = new Date(d);
                                end.setUTCDate(end.getUTCDate() + (Number(hireLength) - 1));
                                endDate = end.toISOString();
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing dates for booking:', bookingId, e);
                    }
                }
                // Fallback: use first/last selected_dates so calendar can show the booking even without delivery_date/hire_length
                if ((!startDate || !endDate) && selectedDates && selectedDates.length > 0) {
                    const first = selectedDates[0];
                    const last = selectedDates[selectedDates.length - 1];
                    if (first) {
                        try {
                            const dFirst = new Date(first + 'T12:00:00');
                            if (!isNaN(dFirst.getTime())) startDate = startDate || dFirst.toISOString();
                        } catch (_) {}
                    }
                    if (last) {
                        try {
                            const dLast = new Date(last + 'T12:00:00');
                            if (!isNaN(dLast.getTime())) endDate = endDate || dLast.toISOString();
                        } catch (_) {}
                    }
                }
                
                return {
                    id: bookingId,
                    name: customerName,
                    email: customerEmail || '', // Convert null to empty string for consistency
                    phone: customerPhone,
                    postcode: booking.postcode || null,
                    deliveryAddress: booking.delivery_address || null,
                    delivery_date: deliveryDate || (startDate ? startDate.slice(0, 10) : null),
                    selectedDates: selectedDates,
                    startDate: startDate,
                    endDate: endDate,
                    days: hireLength,
                    dailyCost: booking.daily_cost || booking.dailyCost || null,
                    deliveryCost: booking.delivery_cost || booking.deliveryCost || null,
                    collectionCost: booking.collection_cost || booking.collectionCost || null,
                    totalCost: booking.total_cost || booking.totalCost || null,
                    notes: booking.notes || null,
                    status: booking.status || 'Awaiting deposit',
                    source: booking.source || 'quote',
                    pod: booking.pod || '16ft Pod',
                    confirmation_email_sent_at: booking.confirmation_email_sent_at || booking.confirmationEmailSentAt || null,
                    createdAt: booking.created_at || booking.createdAt || booking.timestamp || new Date().toISOString(),
                    timestamp: booking.created_at || booking.createdAt || booking.timestamp || new Date().toISOString()
                };
            });
            
            // Return all mapped data - no filtering (was filtering out valid bookings)
            console.log(`📦 Returning ${mappedData.length} bookings (no filtering applied)`);
            
            return mappedData;
        } catch (error) {
            console.error('❌ Exception reading from Supabase:', error);
            console.error('Error stack:', error.stack);
            return [];
        }
    } else {
        console.log('⚠️ Using file system (Supabase admin client not available)');
        // Fall back to file system for local development
        const bookingsPath = path.join(__dirname, '..', 'bookings.json');
        try {
            const data = fs.readFileSync(bookingsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return empty array
            return [];
        }
    }
}

// Save all bookings
async function saveAllBookings(bookings) {
    if (useSupabase && supabase) {
        // Supabase handles individual record upserts, not bulk replacement
        // So we'll just log this for now and use individual insert/update methods
        console.log('Bulk save not supported in Supabase - use addBooking or updateBooking');
        return true;
    } else {
        // Fall back to file system for local development
        const bookingsPath = path.join(__dirname, '..', 'bookings.json');
        try {
            fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
            console.log('Bookings saved to file system');
            return true;
        } catch (error) {
            console.error('Error saving to file system:', error);
            return false;
        }
    }
}

// Add a new booking
async function addBooking(newBooking) {
    console.log('========================================');
    console.log('🔍 addBooking called');
    console.log('  useSupabase:', useSupabase);
    console.log('  supabase available:', !!supabase);
    console.log('  supabaseAdmin type:', typeof supabase);
    console.log('========================================');
    
    if (useSupabase && supabase) {
        try {
            const selectedDates = Array.isArray(newBooking.selectedDates) ? newBooking.selectedDates : [];
            const deliveryDate = newBooking.startDate ? new Date(newBooking.startDate).toISOString().split('T')[0] : null;
            const source = newBooking.source || 'admin';

            const cleanPayload = (payload) => {
                const cleanData = {};
                for (const key of Object.keys(payload)) {
                    const v = payload[key];
                    if (v !== undefined && v !== null && v !== '') {
                        cleanData[key] = v;
                    }
                }
                return cleanData;
            };

            // The live project has used both schemas over time. Try the newer snake_case
            // table first, then fall back to the original camelCase setup documented in the repo.
            const insertAttempts = [
                {
                    label: 'snake_case',
                    payload: cleanPayload({
                        booking_reference: newBooking.id,
                        customer_name: newBooking.name || 'Enquiry',
                        customer_email: newBooking.email || '',
                        customer_phone: newBooking.phone || null,
                        delivery_address: newBooking.deliveryAddress || newBooking.delivery_address || null,
                        postcode: newBooking.postcode || null,
                        delivery_date: deliveryDate,
                        hire_length: newBooking.days ? Number(newBooking.days) : null,
                        selected_dates: selectedDates,
                        notes: newBooking.notes || null,
                        daily_cost: newBooking.dailyCost ? Number(newBooking.dailyCost) : null,
                        delivery_cost: newBooking.deliveryCost ? Number(newBooking.deliveryCost) : null,
                        collection_cost: newBooking.collectionCost ? Number(newBooking.collectionCost) : null,
                        total_cost: newBooking.totalCost ? Number(newBooking.totalCost) : null,
                        status: newBooking.status || 'Awaiting deposit',
                        source,
                        deposit_paid: false,
                    }),
                },
                {
                    label: 'snake_case_core',
                    payload: cleanPayload({
                        booking_reference: newBooking.id,
                        customer_name: newBooking.name || 'Enquiry',
                        customer_email: newBooking.email || '',
                        customer_phone: newBooking.phone || null,
                        postcode: newBooking.postcode || null,
                        delivery_date: deliveryDate,
                        hire_length: newBooking.days ? Number(newBooking.days) : null,
                        selected_dates: selectedDates,
                        notes: newBooking.notes || null,
                        status: newBooking.status || 'Awaiting deposit',
                    }),
                },
                {
                    label: 'camelCase',
                    payload: cleanPayload({
                        id: newBooking.id,
                        name: newBooking.name || 'Enquiry',
                        email: newBooking.email || '',
                        phone: newBooking.phone || null,
                        postcode: newBooking.postcode || null,
                        selectedDates,
                        startDate: newBooking.startDate || null,
                        endDate: newBooking.endDate || null,
                        days: newBooking.days ? Number(newBooking.days) : null,
                        dailyCost: newBooking.dailyCost ? Number(newBooking.dailyCost) : null,
                        deliveryCost: newBooking.deliveryCost ? Number(newBooking.deliveryCost) : null,
                        collectionCost: newBooking.collectionCost ? Number(newBooking.collectionCost) : null,
                        totalCost: newBooking.totalCost ? Number(newBooking.totalCost) : null,
                        notes: newBooking.notes || null,
                        status: newBooking.status || 'Awaiting deposit',
                        source,
                        createdAt: newBooking.createdAt || new Date().toISOString(),
                    }),
                },
            ];

            let lastError = null;
            for (const attempt of insertAttempts) {
                console.log(`💾 Attempting to save booking to Supabase (${attempt.label}):`, newBooking.id);
                console.log('📋 Booking data keys:', Object.keys(attempt.payload));
                console.log('📋 Full booking data:', JSON.stringify(attempt.payload, null, 2));

                const { data, error } = await supabase
                    .from('bookings')
                    .insert([attempt.payload])
                    .select()
                    .single();

                if (!error) {
                    console.log(`✅✅✅ Booking saved to Supabase successfully via ${attempt.label}:`, data?.id || data?.booking_reference);
                    console.log('Saved booking data:', JSON.stringify(data, null, 2));
                    return true;
                }

                lastError = error;
                console.error(`❌ Supabase insert attempt failed (${attempt.label})`);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
            }

            console.error('========================================');
            console.error('❌❌❌ ALL SUPABASE INSERT ATTEMPTS FAILED ❌❌❌');
            console.error('========================================');
            console.error('Last error object:', JSON.stringify(lastError, null, 2));
            console.error('========================================');
            return false;
        } catch (error) {
            console.error('❌ Exception saving to Supabase:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            return false;
        }
    } else {
        console.error('⚠️⚠️⚠️ Supabase admin client NOT available!');
        console.error('  useSupabase:', useSupabase);
        console.error('  supabase:', !!supabase);
        console.error('⚠️ Attempting file system save (will fail on Vercel)');
        // Fall back to file system
        const bookings = await getAllBookings();
        bookings.push(newBooking);
        return await saveAllBookings(bookings);
    }
}

// Update an existing booking (bookingId can be booking_reference or id from admin list)
async function updateBooking(bookingId, updates) {
    if (useSupabase && supabase) {
        try {
            console.log('[updateBooking] Matching by booking_reference or id:', JSON.stringify(bookingId), '(format: e.g. KR-1772922362001)');
            const updateAttempts = Array.isArray(updates)
                ? updates
                : [{ label: 'default', updates }];

            for (const attempt of updateAttempts) {
                const updateData = attempt.updates || {};
                if (Object.keys(updateData).length === 0) continue;

                for (const column of ['booking_reference', 'id']) {
                    const { data, error } = await supabase
                        .from('bookings')
                        .update(updateData)
                        .eq(column, bookingId)
                        .select();

                    console.log(`[updateBooking] attempt=${attempt.label || 'default'} eq(${column}):`, {
                        rowsMatched: data?.length ?? 0,
                        error: error ? { message: error.message, code: error.code, details: error.details } : null,
                        returnedIds: data?.map(r => r.booking_reference || r.id) ?? []
                    });

                    if (error) {
                        console.error(`[updateBooking] Supabase error (${attempt.label || 'default'} / ${column}):`, error.message);
                        continue;
                    }

                    if (data && data.length > 0) {
                        console.log(`[updateBooking] SUCCESS via ${attempt.label || 'default'} / ${column}`);
                        return true;
                    }
                }
            }

            console.error('[updateBooking] No rows matched for bookingId:', bookingId, '| Tried all schema and id column attempts');
            return false;
        } catch (error) {
            console.error('Error updating to Supabase:', error);
            return false;
        }
    } else {
        // Fall back to file system
        const bookings = await getAllBookings();
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index === -1) {
            return false;
        }
        bookings[index] = { ...bookings[index], ...updates };
        return await saveAllBookings(bookings);
    }
}

// Delete a booking (bookingId can be booking_reference or id from admin list)
async function deleteBooking(bookingId) {
    if (useSupabase && supabase) {
        try {
            // Try booking_reference first, then id (handles both schema variants)
            let { error } = await supabase
                .from('bookings')
                .delete()
                .eq('booking_reference', bookingId);
            if (error) {
                console.error('Error deleting from Supabase (booking_reference):', error);
                return false;
            }
            // Also try by id in case table uses id as primary identifier
            ({ error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId));
            
            if (error) {
                console.error('Error deleting from Supabase:', error);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
            return false;
        }
    } else {
        // Fall back to file system
        const bookings = await getAllBookings();
        const filtered = bookings.filter(b => b.id !== bookingId);
        return await saveAllBookings(filtered);
    }
}

module.exports = {
    getAllBookings,
    saveAllBookings,
    addBooking,
    updateBooking,
    deleteBooking
};
