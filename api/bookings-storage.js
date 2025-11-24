const fs = require('fs');
const path = require('path');

// Try to use Supabase if available, otherwise fall back to file system for local dev
let supabase = null;
let useSupabase = false;

try {
    // Only use Supabase if credentials are available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY
        );
        useSupabase = true;
        console.log('✅ Using Supabase for bookings storage');
        console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
        console.log('Supabase Key:', process.env.SUPABASE_KEY ? 'Set' : 'Missing');
    } else {
        console.log('⚠️ Supabase credentials not found:');
        console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'MISSING');
        console.log('  SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'MISSING');
        console.log('⚠️ Falling back to file system (will not work on Vercel!)');
    }
} catch (error) {
    console.error('❌ Error initializing Supabase:', error.message);
    console.log('⚠️ Falling back to file system (will not work on Vercel!)');
}

const BOOKINGS_KEY = 'bookings';

// Get all bookings
async function getAllBookings() {
    if (useSupabase && supabase) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching from Supabase:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Error reading from Supabase:', error);
            return [];
        }
    } else {
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
    if (useSupabase && supabase) {
        try {
            // Prepare booking data for Supabase
            const bookingData = {
                ...newBooking,
                // Ensure created_at is set (Supabase expects this)
                created_at: newBooking.created_at || newBooking.createdAt || new Date().toISOString(),
                // Keep timestamp for compatibility
                timestamp: newBooking.timestamp || new Date().toISOString(),
            };
            
            // Remove any undefined values
            Object.keys(bookingData).forEach(key => {
                if (bookingData[key] === undefined) {
                    delete bookingData[key];
                }
            });
            
            console.log('Attempting to save booking to Supabase:', bookingData.id);
            console.log('Booking data keys:', Object.keys(bookingData));
            
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Supabase insert error:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                console.error('Error details:', error.details);
                console.error('Error hint:', error.hint);
                return false;
            }
            
            console.log('✅ Booking saved to Supabase successfully:', data?.id);
            return true;
        } catch (error) {
            console.error('❌ Exception saving to Supabase:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    } else {
        console.log('⚠️ Supabase not available - attempting file system save (will fail on Vercel)');
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
