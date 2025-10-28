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
        console.log('Using Supabase for bookings storage');
    }
} catch (error) {
    console.log('Supabase not available, using file system');
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
            // Add created_at if not present
            if (!newBooking.created_at) {
                newBooking.created_at = new Date().toISOString();
            }
            
            const { data, error } = await supabase
                .from('bookings')
                .insert([newBooking])
                .select()
                .single();
            
            if (error) {
                console.error('Error inserting to Supabase:', error);
                return false;
            }
            
            console.log('Booking saved to Supabase');
            return true;
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            return false;
        }
    } else {
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
