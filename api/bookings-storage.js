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
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌❌❌ SUPABASE SELECT ERROR ❌❌❌');
                console.error('Error object:', JSON.stringify(error, null, 2));
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                return [];
            }
            
            console.log(`✅ Fetched ${data?.length || 0} bookings from Supabase`);
            if (data && data.length > 0) {
                console.log('Sample booking:', {
                    id: data[0].id,
                    booking_reference: data[0].booking_reference,
                    customer_name: data[0].customer_name,
                    customer_email: data[0].customer_email,
                    status: data[0].status
                });
            }
            
            // Map Supabase schema to expected format for admin
            const mappedData = (data || []).map(booking => ({
                id: booking.booking_reference || booking.id,
                name: booking.customer_name,
                email: booking.customer_email,
                phone: booking.customer_phone,
                postcode: booking.postcode,
                selectedDates: Array.isArray(booking.selected_dates) ? booking.selected_dates : (booking.selected_dates ? [booking.selected_dates] : []),
                startDate: booking.delivery_date ? new Date(booking.delivery_date).toISOString() : null,
                endDate: booking.delivery_date && booking.hire_length ? new Date(new Date(booking.delivery_date).getTime() + (booking.hire_length - 1) * 24 * 60 * 60 * 1000).toISOString() : null,
                days: booking.hire_length,
                dailyCost: booking.daily_cost,
                deliveryCost: booking.delivery_cost,
                collectionCost: booking.collection_cost,
                totalCost: booking.total_cost,
                notes: booking.notes,
                status: booking.status,
                source: 'quote', // Default since not in schema
                pod: '16ft Pod', // Default since not in schema
                createdAt: booking.created_at,
                timestamp: booking.created_at
            }));
            
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
            // Prepare booking data for Supabase
            // Map to match ACTUAL Supabase schema (customer_name, customer_email, etc.)
            const bookingData = {
                // id is UUID in Supabase, but we're using text ID - let Supabase generate UUID or convert
                // For now, we'll let Supabase generate the UUID and use booking_reference for our ID
                booking_reference: newBooking.id,
                customer_name: newBooking.name,
                customer_email: newBooking.email,
                customer_phone: newBooking.phone || null,
                delivery_address: null, // Not provided in quote form
                postcode: newBooking.postcode || null,
                delivery_date: newBooking.startDate ? new Date(newBooking.startDate).toISOString().split('T')[0] : null,
                hire_length: newBooking.days ? Number(newBooking.days) : null,
                selected_dates: Array.isArray(newBooking.selectedDates) ? newBooking.selectedDates : [],
                notes: newBooking.notes || null,
                daily_cost: newBooking.dailyCost ? Number(newBooking.dailyCost) : null,
                delivery_cost: newBooking.deliveryCost ? Number(newBooking.deliveryCost) : null,
                collection_cost: newBooking.collectionCost ? Number(newBooking.collectionCost) : null,
                total_cost: newBooking.totalCost ? Number(newBooking.totalCost) : null,
                status: newBooking.status || 'Awaiting deposit',
                deposit_paid: false,
                // created_at will be set automatically by Supabase
                // updated_at will be set automatically by Supabase
            };
            
            // Remove any null/undefined values that might cause issues
            Object.keys(bookingData).forEach(key => {
                if (bookingData[key] === undefined || bookingData[key] === '') {
                    // Keep empty strings as null for optional fields
                    if (bookingData[key] === '') {
                        bookingData[key] = null;
                    } else {
                        delete bookingData[key];
                    }
                }
            });
            
            console.log('💾 Attempting to save booking to Supabase (admin client):', bookingData.id);
            console.log('📋 Booking data keys:', Object.keys(bookingData));
            console.log('📋 Full booking data:', JSON.stringify(bookingData, null, 2));
            
            // Try the insert
            console.log('🔍 Calling supabase.from("bookings").insert()...');
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();
            
            console.log('🔍 Insert response received');
            console.log('  data:', data ? 'Present' : 'null');
            console.log('  error:', error ? 'Present' : 'null');
            
            if (error) {
                console.error('========================================');
                console.error('❌❌❌ SUPABASE INSERT ERROR ❌❌❌');
                console.error('========================================');
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                console.error('Full error object:', JSON.stringify(error, null, 2));
                console.error('========================================');
                console.error('Data we tried to insert:');
                console.error(JSON.stringify(bookingData, null, 2));
                console.error('========================================');
                return false;
            }
            
            console.log('✅✅✅ Booking saved to Supabase successfully:', data?.id);
            console.log('Saved booking data:', JSON.stringify(data, null, 2));
            return true;
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

// Update an existing booking
async function updateBooking(bookingId, updates) {
    if (useSupabase && supabase) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', bookingId)
                .select();
            
            if (error) {
                console.error('Error updating Supabase:', error);
                return false;
            }
            
            return true;
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

// Delete a booking
async function deleteBooking(bookingId) {
    if (useSupabase && supabase) {
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);
            
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
