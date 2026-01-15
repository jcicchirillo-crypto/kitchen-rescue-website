#!/usr/bin/env node

/**
 * Quick Supabase Verification Script
 * 
 * Verifies your Supabase connection and shows what's in the database
 * 
 * Usage:
 *   SUPABASE_URL=https://pgjkdehkmkstcfspcvaa.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/verify-supabase.js
 */

require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || 'https://pgjkdehkmkstcfspcvaa.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 ===== SUPABASE VERIFICATION =====\n');
console.log('URL:', url);
console.log('Key:', key ? key.substring(0, 20) + '...' : 'MISSING\n');

if (!key) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing!');
    console.error('   Set it in your .env file or as an environment variable.\n');
    process.exit(1);
}

const supabase = createClient(url, key, {
    auth: { 
        persistSession: false, 
        autoRefreshToken: false 
    },
});

async function verify() {
    try {
        console.log('📥 Testing connection...\n');
        
        // Test 1: Simple query
        const { data, error, count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact' })
            .limit(1);
        
        if (error) {
            console.error('❌ Connection Error:');
            console.error('   Code:', error.code);
            console.error('   Message:', error.message);
            console.error('   Details:', error.details);
            console.error('   Hint:', error.hint);
            
            if (error.code === 'PGRST116') {
                console.error('\n⚠️  The "bookings" table does not exist!');
                console.error('   You need to create it in Supabase first.');
            }
            return;
        }
        
        console.log('✅ Connection successful!\n');
        
        // Get total count
        const { count: totalCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Total bookings in database: ${totalCount || 0}\n`);
        
        if (totalCount === 0) {
            console.log('⚠️  Database is empty - no bookings found.\n');
            return;
        }
        
        // Get all bookings
        const { data: allBookings, error: allError } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (allError) {
            console.error('Error fetching bookings:', allError);
            return;
        }
        
        // Count by status
        const statusCounts = {};
        allBookings.forEach(b => {
            const status = b.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Count by source
        const sourceCounts = {};
        allBookings.forEach(b => {
            const source = b.source || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        
        // Trade pack requests
        const tradePack = allBookings.filter(b => 
            b.status === 'Trade Pack Request' || 
            b.source === 'trade-landing' || 
            b.source === 'trade-quote' ||
            b.source === 'trade-quote-calculated'
        );
        
        // December 2024
        const december2024 = allBookings.filter(b => {
            if (!b.created_at) return false;
            const date = new Date(b.created_at);
            return date.getMonth() === 11 && date.getFullYear() === 2024;
        });
        
        console.log('📋 By Status:');
        Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
        console.log('\n📦 By Source:');
        Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
            console.log(`   ${source}: ${count}`);
        });
        
        console.log(`\n📦 Trade Pack Requests: ${tradePack.length}`);
        console.log(`📅 December 2024: ${december2024.length}\n`);
        
        if (tradePack.length > 0) {
            console.log('📦 Trade Pack Requests:');
            tradePack.slice(0, 10).forEach((b, i) => {
                console.log(`   ${i + 1}. ${b.customer_name || 'No name'} (${b.customer_email || 'No email'})`);
                console.log(`      Created: ${b.created_at || 'Unknown'}`);
                console.log(`      Status: ${b.status || 'Unknown'}`);
                console.log(`      Source: ${b.source || 'Unknown'}\n`);
            });
        }
        
        if (december2024.length > 0) {
            console.log('📅 December 2024 Bookings:');
            december2024.forEach((b, i) => {
                console.log(`   ${i + 1}. ${b.customer_name || 'No name'} (${b.customer_email || 'No email'})`);
                console.log(`      Created: ${b.created_at || 'Unknown'}`);
                console.log(`      Status: ${b.status || 'Unknown'}`);
                console.log(`      Source: ${b.source || 'Unknown'}\n`);
            });
        }
        
        console.log('✅ Verification complete!\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('   Stack:', error.stack);
    }
}

verify();
