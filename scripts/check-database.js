#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * 
 * This script checks your Supabase connection and lists all bookings,
 * with special focus on trade pack requests and December 2024 bookings.
 * 
 * Usage:
 *   node scripts/check-database.js
 * 
 * Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * set in your environment variables or .env file
 */

require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 ===== DATABASE DIAGNOSTIC CHECK =====\n');

if (!url || !key) {
    console.error('❌ Missing Supabase credentials!');
    console.error('   SUPABASE_URL:', url ? '✅ Set' : '❌ MISSING');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', key ? '✅ Set' : '❌ MISSING');
    console.error('\n   Please set these in your .env file or environment variables.\n');
    process.exit(1);
}

console.log('✅ Supabase credentials found');
console.log('   URL:', url.substring(0, 30) + '...');
console.log('   Key:', key.substring(0, 20) + '...\n');

const supabase = createClient(url, key, {
    auth: { 
        persistSession: false, 
        autoRefreshToken: false 
    },
});

async function runDiagnostics() {
    try {
        console.log('📥 Fetching all bookings from Supabase...\n');
        
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error querying Supabase:');
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
            console.error('   Details:', error.details);
            console.error('   Hint:', error.hint);
            return;
        }

        const bookings = data || [];
        console.log(`✅ Successfully fetched ${bookings.length} bookings\n`);

        // Statistics
        console.log('📊 STATISTICS');
        console.log('─'.repeat(50));
        
        // By status
        const statusCounts = {};
        bookings.forEach(b => {
            const status = b.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('\n📋 By Status:');
        Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        // By source
        const sourceCounts = {};
        bookings.forEach(b => {
            const source = b.source || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        console.log('\n📦 By Source:');
        Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
            console.log(`   ${source}: ${count}`);
        });

        // Trade pack requests
        const tradePackRequests = bookings.filter(b => 
            b.status === 'Trade Pack Request' || 
            b.source === 'trade-landing' || 
            b.source === 'trade-quote' ||
            b.source === 'trade-quote-calculated'
        );
        console.log(`\n📦 Trade Pack/Quote Requests: ${tradePackRequests.length}`);

        // December 2024 bookings
        const december2024 = bookings.filter(b => {
            if (!b.created_at) return false;
            const date = new Date(b.created_at);
            return date.getMonth() === 11 && date.getFullYear() === 2024;
        });
        console.log(`📅 December 2024 Bookings: ${december2024.length}`);

        // By month
        const monthCounts = {};
        bookings.forEach(b => {
            if (b.created_at) {
                const date = new Date(b.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            }
        });
        console.log('\n📅 By Month:');
        Object.entries(monthCounts).sort().forEach(([month, count]) => {
            console.log(`   ${month}: ${count}`);
        });

        // Show trade pack requests
        if (tradePackRequests.length > 0) {
            console.log('\n\n📦 TRADE PACK REQUESTS');
            console.log('─'.repeat(50));
            tradePackRequests.slice(0, 20).forEach((b, i) => {
                console.log(`\n${i + 1}. ${b.customer_name || 'No name'} (${b.customer_email || 'No email'})`);
                console.log(`   ID: ${b.booking_reference || b.id}`);
                console.log(`   Status: ${b.status || 'Unknown'}`);
                console.log(`   Source: ${b.source || 'Unknown'}`);
                console.log(`   Created: ${b.created_at || 'Unknown'}`);
                if (b.notes) {
                    console.log(`   Notes: ${b.notes.substring(0, 100)}${b.notes.length > 100 ? '...' : ''}`);
                }
            });
            if (tradePackRequests.length > 20) {
                console.log(`\n   ... and ${tradePackRequests.length - 20} more`);
            }
        } else {
            console.log('\n⚠️  No trade pack requests found!');
        }

        // Show December 2024 bookings
        if (december2024.length > 0) {
            console.log('\n\n📅 DECEMBER 2024 BOOKINGS');
            console.log('─'.repeat(50));
            december2024.forEach((b, i) => {
                console.log(`\n${i + 1}. ${b.customer_name || 'No name'} (${b.customer_email || 'No email'})`);
                console.log(`   ID: ${b.booking_reference || b.id}`);
                console.log(`   Status: ${b.status || 'Unknown'}`);
                console.log(`   Source: ${b.source || 'Unknown'}`);
                console.log(`   Created: ${b.created_at || 'Unknown'}`);
            });
        } else {
            console.log('\n⚠️  No December 2024 bookings found!');
        }

        // Show recent bookings
        console.log('\n\n📋 RECENT BOOKINGS (Last 10)');
        console.log('─'.repeat(50));
        bookings.slice(0, 10).forEach((b, i) => {
            console.log(`\n${i + 1}. ${b.customer_name || 'No name'} (${b.customer_email || 'No email'})`);
            console.log(`   ID: ${b.booking_reference || b.id}`);
            console.log(`   Status: ${b.status || 'Unknown'}`);
            console.log(`   Source: ${b.source || 'Unknown'}`);
            console.log(`   Created: ${b.created_at || 'Unknown'}`);
        });

        console.log('\n\n✅ Diagnostic complete!\n');

    } catch (error) {
        console.error('\n❌ Error running diagnostics:');
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

runDiagnostics();
