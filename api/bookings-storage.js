const fs = require('fs');
const path = require('path');

// Try to use Vercel KV if available, otherwise fall back to file system for local dev
let kv = null;
let useKV = false;

try {
    // Only import KV if in Vercel environment
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const { createClient } = require('@vercel/kv');
        kv = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
        useKV = true;
        console.log('Using Vercel KV for bookings storage');
    }
} catch (error) {
    console.log('Vercel KV not available, using file system');
}

const BOOKINGS_KEY = 'bookings';

// Get all bookings
async function getAllBookings() {
    if (useKV && kv) {
        try {
            const bookings = await kv.get(BOOKINGS_KEY);
            return bookings || [];
        } catch (error) {
            console.error('Error reading from KV:', error);
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
    if (useKV && kv) {
        try {
            await kv.set(BOOKINGS_KEY, bookings);
            console.log('Bookings saved to KV storage');
            return true;
        } catch (error) {
            console.error('Error saving to KV:', error);
            return false;
        }
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
    const bookings = await getAllBookings();
    bookings.push(newBooking);
    return await saveAllBookings(bookings);
}

// Update an existing booking
async function updateBooking(bookingId, updates) {
    const bookings = await getAllBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) {
        return false;
    }
    bookings[index] = { ...bookings[index], ...updates };
    return await saveAllBookings(bookings);
}

// Delete a booking
async function deleteBooking(bookingId) {
    const bookings = await getAllBookings();
    const filtered = bookings.filter(b => b.id !== bookingId);
    return await saveAllBookings(filtered);
}

module.exports = {
    getAllBookings,
    saveAllBookings,
    addBooking,
    updateBooking,
    deleteBooking
};

